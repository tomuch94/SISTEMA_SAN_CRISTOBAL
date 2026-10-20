// routes/prefacturas.js
const express = require("express");
const router = express.Router();
const db = require("../db");
const path = require('path');
const fs = require('fs');
const pdf = require('html-pdf');

router.get("/", (req, res) => {
  db.query("SELECT * FROM prefactura", (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

router.post("/", (req, res) => {
  console.log("POST Insertar Prefactura", req.body)
  const { cod_cliente, fecha, factura, total, codigo_factura } = req.body;
  db.query(
    "INSERT INTO prefactura (cod_cliente, fecha, factura, total, cod_factura) VALUES (?, ?, ?, ?, ?)",
    [cod_cliente, fecha, factura, total, codigo_factura],
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Prefactura agregada" });
    }
  );
});

router.get("/ultimo_codigo", (req, res) => {
  // db.query("SELECT factura FROM prefactura ORDER BY cod_factura DESC LIMIT 1", (err, results) => {
  db.query("SELECT cod_factura FROM prefactura ORDER BY cod_factura DESC LIMIT 1", (err, results) => {
    if (err) return res.status(500).json(err);
    console.log(results[0])
    res.json({ ultimo_codigo: results.length > 0 ? results[0].cod_factura : null });
  });
});

// Ruta para generar PDF
router.post('/generar-pdf', (req, res) => {
  try {
    console.log("POST generar-pdf",req.body)
    // Datos recibidos del cliente
    const { 
      codigo_factura, 
      fecha, 
      cliente, 
      productos, 
      total 
    } = req.body;

    // Leer la plantilla HTML
    const ubicacionPlantilla = path.join(__dirname, 'formato.html');
    let contenidoHtml = fs.readFileSync(ubicacionPlantilla, 'utf8');

    // Reemplazar variables en la plantilla
    contenidoHtml = contenidoHtml.replace("XX-X", codigo_factura);
    contenidoHtml = contenidoHtml.replace("02/07/2022", fecha);

    // Información del cliente
    if (cliente) {
      contenidoHtml = contenidoHtml.replace("4490734-6", cliente.nit || '-');
      contenidoHtml = contenidoHtml.replace("Edgar Guamuch", cliente.nombre || '-');
      contenidoHtml = contenidoHtml.replace("Ninguno", cliente.contacto || 'Ninguno');
      contenidoHtml = contenidoHtml.replace("Guatemala", cliente.ciudad || 'Guatemala');
      contenidoHtml = contenidoHtml.replace("24746174", cliente.telefono || '-');
      contenidoHtml = contenidoHtml.replace("28 Av. 14-72, Zona 7, Ciudad de Plata 2", cliente.direccion || '-');
      contenidoHtml = contenidoHtml.replace("edgarorlando94@gmail.com", cliente.email || '-');
      contenidoHtml = contenidoHtml.replace("Efectivo", cliente.tipo_pago || 'Efectivo');
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

    // Reemplazar contenido de productos y total
    contenidoHtml = contenidoHtml.replace("{{contenido}}", valor_contenido);
    contenidoHtml = contenidoHtml.replace("{{total}}", `Q ${total}`);

    // Opciones para el PDF
    const options = {
      format: 'Letter',
      border: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in'
      }
    };

    // Crear el PDF y enviarlo como respuesta
    pdf.create(contenidoHtml, options).toBuffer((error, buffer) => {
      if (error) {
        console.error("Error al crear PDF:", error);
        return res.status(500).send("Error al generar el PDF");
      }
      
      // Enviar el buffer como respuesta
      res.type('application/pdf');
      res.send(buffer);
    });
  } catch (error) {
    console.error("Error en generación de PDF:", error);
    res.status(500).send("Error en el servidor al generar el PDF");
  }
});

module.exports = router;