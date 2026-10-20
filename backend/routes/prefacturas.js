const express = require("express");
const router = express.Router();
const db = require("../db");
const path = require("path");
const fs = require("fs");
const puppeteer = require("puppeteer");

router.get("/", (req, res) => {
  // Incluye nombre y NIT del cliente; la fecha se devuelve como texto (YYYY-MM-DD) para evitar desfases de zona horaria
  db.query(
    `SELECT p.cod_factura, p.cod_cliente, DATE_FORMAT(p.fecha, '%Y-%m-%d') AS fecha, p.factura, p.total,
            c.nombre, c.nit
       FROM prefactura p
       LEFT JOIN cliente c ON c.cod_cliente = p.cod_cliente
      ORDER BY p.fecha DESC, p.cod_factura DESC`,
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results);
    }
  );
});

router.post("/", (req, res) => {
  console.log("POST Insertar Prefactura", req.body);
  const { cod_cliente, fecha, factura, total, codigo_factura, detalles } = req.body;

  // 🔹 Iniciar una transacción para asegurar que ambas inserciones sean atómicas
  db.beginTransaction((err) => {
    if (err) {
      console.error("Error al iniciar transacción:", err);
      return res.status(500).json({ error: "Error al iniciar transacción" });
    }

    // 🔹 Insertar la prefactura principal
    db.query(
      "INSERT INTO prefactura (cod_cliente, fecha, factura, total, cod_factura) VALUES (?, ?, ?, ?, ?)",
      [cod_cliente, fecha, factura, total, codigo_factura],
      (err, results) => {
        if (err) {
          db.rollback(() => {
            console.error("Error al insertar prefactura:", err);
            return res.status(500).json({ error: "Error al guardar la prefactura" });
          });
        } else {
          const prefacturaId = results.insertId; // Obtener el ID de la prefactura insertada

          // 🔹 Verificar que haya productos en `detalles`
          if (!detalles || detalles.length === 0) {
            console.warn("Advertencia: No hay detalles de prefactura para insertar.");
            db.commit(() => res.json({ message: "Prefactura agregada sin productos" }));
            return;
          }

          // 🔹 Preparar valores para la inserción en `detalle_prefactura`
          const detalleValores = detalles.map((detalle) => [
            codigo_factura,
            detalle.cod_producto,
            detalle.precio,
            detalle.cantidad,
            detalle.total
          ]);
          console.log("DETALLER: ", detalles)
          // 🔹 CORRECCIÓN: Usar el nombre correcto de la tabla "detalle_prefactura" que existe en la base de datos
          db.query(
            "INSERT INTO detalle_prefactura (cod_prefactura, cod_producto, precio, cantidad, total) VALUES ?",
            [detalleValores],
            (err) => {
              if (err) {
                db.rollback(() => {
                  console.error("Error al insertar detalles de prefactura:", err);
                  return res.status(500).json({ error: "Error al guardar los detalles de la prefactura" });
                });
              } else {
                // 🔹 Confirmar la transacción
                db.commit(() => {
                  console.log("Prefactura y detalles guardados correctamente");
                  res.json({ message: "Prefactura agregada con éxito" });
                });
              }
            }
          );
        }
      }
    );
  });
});


router.get("/ultimo_codigo", (req, res) => {
  db.query("SELECT cod_factura FROM prefactura ORDER BY cod_factura DESC LIMIT 1", (err, results) => {
    if (err) return res.status(500).json(err);
    console.log(results[0]);
    res.json({ ultimo_codigo: results.length > 0 ? results[0].cod_factura : null });
  });
});

// Obtener una prefactura con su cliente y detalle (para editarla)
// Debe ir después de /ultimo_codigo para que esa ruta no se tome como un código
router.get("/:cod_factura", (req, res) => {
  const { cod_factura } = req.params;
  db.query(
    `SELECT p.cod_factura, p.cod_cliente, DATE_FORMAT(p.fecha, '%Y-%m-%d') AS fecha, p.factura, p.total,
            c.nombre, c.nit
       FROM prefactura p
       LEFT JOIN cliente c ON c.cod_cliente = p.cod_cliente
      WHERE p.cod_factura = ?`,
    [cod_factura],
    (err, prefacturas) => {
      if (err) return res.status(500).json(err);
      if (prefacturas.length === 0) return res.status(404).json({ error: "Prefactura no encontrada" });

      db.query(
        `SELECT d.cod_producto, d.precio, d.cantidad, d.total, pr.descripcion, pr.stock, um.medida
           FROM detalle_prefactura d
           INNER JOIN producto pr ON pr.cod_producto = d.cod_producto
           LEFT JOIN unidad_medida um ON um.cod_unidad = pr.cod_unidad
          WHERE d.cod_prefactura = ?
          ORDER BY d.iddetalle_prefactura`,
        [cod_factura],
        (err, detalles) => {
          if (err) return res.status(500).json(err);
          res.json({ ...prefacturas[0], detalles });
        }
      );
    }
  );
});

// Actualizar una prefactura: encabezado y detalle (el detalle se reemplaza completo)
router.put("/:cod_factura", (req, res) => {
  console.log("PUT Actualizar Prefactura", req.params.cod_factura, req.body);
  const { cod_factura } = req.params;
  const { cod_cliente, fecha, total, detalles } = req.body;

  if (!cod_cliente || !fecha) {
    return res.status(400).json({ error: "Cliente y fecha son obligatorios" });
  }

  db.query("SELECT factura FROM prefactura WHERE cod_factura = ?", [cod_factura], (err, results) => {
    if (err) return res.status(500).json(err);
    if (results.length === 0) return res.status(404).json({ error: "Prefactura no encontrada" });
    // Una prefactura ya facturada no se puede modificar
    if (Number(results[0].factura) === 1) {
      return res.status(409).json({ error: "La prefactura ya fue facturada y no se puede modificar" });
    }

    db.beginTransaction((err) => {
      if (err) {
        console.error("Error al iniciar transacción:", err);
        return res.status(500).json({ error: "Error al iniciar transacción" });
      }

      const fallar = (mensaje, error) =>
        db.rollback(() => {
          console.error(mensaje, error);
          res.status(500).json({ error: mensaje });
        });

      db.query(
        "UPDATE prefactura SET cod_cliente = ?, fecha = ?, total = ? WHERE cod_factura = ?",
        [cod_cliente, fecha, total, cod_factura],
        (err) => {
          if (err) return fallar("Error al actualizar la prefactura", err);

          db.query("DELETE FROM detalle_prefactura WHERE cod_prefactura = ?", [cod_factura], (err) => {
            if (err) return fallar("Error al actualizar los detalles de la prefactura", err);

            const confirmar = () =>
              db.commit((err) => {
                if (err) return fallar("Error al confirmar los cambios", err);
                console.log("Prefactura actualizada correctamente");
                res.json({ message: "Prefactura actualizada con éxito" });
              });

            if (!detalles || detalles.length === 0) return confirmar();

            const detalleValores = detalles.map((detalle) => [
              cod_factura,
              detalle.cod_producto,
              detalle.precio,
              detalle.cantidad,
              detalle.total
            ]);
            db.query(
              "INSERT INTO detalle_prefactura (cod_prefactura, cod_producto, precio, cantidad, total) VALUES ?",
              [detalleValores],
              (err) => {
                if (err) return fallar("Error al guardar los detalles de la prefactura", err);
                confirmar();
              }
            );
          });
        }
      );
    });
  });
});

// 🔹 Función para convertir números a letras
// Función para convertir números a letras (manejando miles, millones)
const numeroALetras = (num) => {
  const unidades = ["", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve"];
  const especiales = ["", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve"];
  const decenas = ["", "diez", "veinte", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
  const centenas = ["", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"];
  
  // Función auxiliar para convertir números menores a 1000
  const convertirMenorMil = (n) => {
    let resultado = "";
    
    // Manejo de centenas
    if (n >= 100) {
      if (n === 100) {
        return "cien";
      }
      let centena = Math.floor(n / 100);
      resultado += centenas[centena] + " ";
      n %= 100;
    }
    
    // Manejo de decenas y unidades
    if (n > 0) {
      if (n < 10) {
        resultado += unidades[n];
      } else if (n < 20) {
        resultado += especiales[n - 10];
      } else {
        let decena = Math.floor(n / 10);
        let unidad = n % 10;
        
        if (unidad === 0) {
          resultado += decenas[decena];
        } else {
          if (decena === 2) {
            resultado += "veinti" + unidades[unidad];
          } else {
            resultado += decenas[decena] + " y " + unidades[unidad];
          }
        }
      }
    }
    
    return resultado.trim();
  };
  
  if (num === 0) return "cero";
  
  let numStr = num.toString();
  let partes = numStr.split(".");
  let entero = parseInt(partes[0], 10);
  let centavos = partes.length > 1 ? parseInt(partes[1].padEnd(2, '0').substring(0, 2), 10) : 0;
  
  let resultado = "";
  
  // Manejo de millones
  if (entero >= 1000000) {
    let millones = Math.floor(entero / 1000000);
    if (millones === 1) {
      resultado += "un millón ";
    } else {
      resultado += convertirMenorMil(millones) + " millones ";
    }
    entero %= 1000000;
  }
  
  // Manejo de miles
  if (entero >= 1000) {
    let miles = Math.floor(entero / 1000);
    if (miles === 1) {
      resultado += "mil ";
    } else {
      resultado += convertirMenorMil(miles) + " mil ";
    }
    entero %= 1000;
  }
  
  // Manejo de centenas, decenas y unidades
  if (entero > 0) {
    resultado += convertirMenorMil(entero);
  }
  
  resultado = resultado.trim();
  
  // Formateo de centavos
  let textoCentavos = centavos > 0 ? ` con ${centavos}/100` : " exactos";
  
  return `Q${num.toFixed(2)} (${resultado}${textoCentavos})`;
};

// Ruta para generar PDF
router.post("/generar-pdf", async (req, res) => {
  try {
    console.log("POST generar-pdf", req.body);
    
    // Datos recibidos del cliente
    const { codigo_factura, fecha, cliente, productos, total } = req.body;

    // Convertir el total a letras
    const totalEnLetras = numeroALetras(parseFloat(total));

    // Leer la plantilla HTML
    const ubicacionPlantilla = path.join(__dirname, "formato.html");
    let contenidoHtml = fs.readFileSync(ubicacionPlantilla, "utf8");

    // Reemplazar variables en la plantilla
    contenidoHtml = contenidoHtml.replace("XX-X", codigo_factura);
    contenidoHtml = contenidoHtml.replace("02/07/2022", fecha);

    // Información del cliente
    if (cliente) {
      contenidoHtml = contenidoHtml.replace("4490734-6", cliente.nit || "-");
      contenidoHtml = contenidoHtml.replace("Edgar Guamuch", cliente.nombre || "-");
      contenidoHtml = contenidoHtml.replace("Ninguno", cliente.contacto || "Ninguno");
      contenidoHtml = contenidoHtml.replace("Guatemala", cliente.ciudad || "Guatemala");
      contenidoHtml = contenidoHtml.replace("24746174", cliente.telefono || "-");
      contenidoHtml = contenidoHtml.replace("28 Av. 14-72, Zona 7, Ciudad de Plata 2", cliente.direccion || "-");
      contenidoHtml = contenidoHtml.replace("edgarorlando94@gmail.com", cliente.email || "-");
      contenidoHtml = contenidoHtml.replace("Efectivo", cliente.tipo_pago || "Efectivo");
    }

    // Generar filas de productos
    let valor_contenido = "";
    productos.forEach(producto => {
      valor_contenido += `<tr>
        <td>${producto.descripcion}</td>
        <td style="text-align: center;">${producto.cantidad}</td>
        <td style="text-align: center;">${producto.unidad}</td>
        <td style="text-align: right;">Q ${producto.precioUnitario}</td>
        <td style="text-align: right;">Q ${producto.total}</td>
      </tr>`;
    });

    // Reemplazar contenido de productos, total y monto en letras
    contenidoHtml = contenidoHtml.replace("{{contenido}}", valor_contenido);
    contenidoHtml = contenidoHtml.replace("{{total}}", `Q ${total}`);
    contenidoHtml = contenidoHtml.replace("{{total_en_letras}}", totalEnLetras); // 🔹 Se agrega monto en letras

    // Opciones para el PDF
const browser = await puppeteer.launch({
  headless: "new",
  args: ["--no-sandbox", "--disable-setuid-sandbox"]
});

const page = await browser.newPage();
await page.setContent(contenidoHtml, { waitUntil: "networkidle0" });

const buffer = await page.pdf({
  format: "Letter",
  printBackground: true, 
  margin: {
    top: "0.5in",
    right: "0.5in",
    bottom: "0.5in",
    left: "0.5in"
  }
});

await browser.close();

res.type("application/pdf");
res.send(buffer);
  } catch (error) {
    console.error("Error en generación de PDF:", error);
    res.status(500).send("Error en el servidor al generar el PDF");
  }
});

module.exports = router;
