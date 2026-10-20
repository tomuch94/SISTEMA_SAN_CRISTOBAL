// routes/productos.js
const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", (req, res) => {
  db.query("SELECT p.*, um.medida FROM producto p INNER JOIN unidad_medida um ON um.cod_unidad = p.cod_unidad", (err, results) => {
    if (err) return res.status(500).json(err);
    console.log("PRODUCTOS", results)
    res.json(results);
  });
});

// Reporte: productos con la fecha de su última actualización de precio y los días transcurridos.
// Los días se calculan en la base de datos para no depender del reloj del navegador.
router.get("/reporte-precios", (req, res) => {
  db.query(
    `SELECT p.cod_producto, p.descripcion, p.precio_compra, p.precio_venta, p.stock, p.estado,
            um.medida,
            DATE_FORMAT(p.fecha_actualizacion_precio, '%Y-%m-%d %H:%i') AS fecha_actualizacion_precio,
            DATEDIFF(NOW(), p.fecha_actualizacion_precio) AS dias_sin_actualizar
       FROM producto p
       LEFT JOIN unidad_medida um ON um.cod_unidad = p.cod_unidad
      ORDER BY p.fecha_actualizacion_precio IS NOT NULL, p.fecha_actualizacion_precio ASC, p.descripcion`,
    (err, results) => {
      if (err) {
        console.error("Error en reporte de precios:", err);
        return res.status(500).json(err);
      }
      res.json(results);
    }
  );
});

// Insertar producto
router.post("/", (req, res) => {
  console.log("POST Productos", req.body)
  const { descripcion, precio_compra, precio_venta, stock, cod_unidad } = req.body;
  // Todo producto nuevo se registra como Activo (estado = 1)
  db.query(
    "INSERT INTO producto (descripcion, precio_compra, precio_venta, stock, cod_unidad, estado) VALUES (?, ?, ?, ?, ?, 1)",
    [descripcion, precio_compra, precio_venta, stock, cod_unidad],
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Producto agregado correctamente" });
    }
  );
});

router.put("/:cod_producto", (req, res) => {
  const { cod_producto } = req.params;
  const { descripcion, precio_compra, precio_venta, stock, cod_unidad, estado } = req.body;
  // estado es opcional: si no se envía, se conserva el actual
  const nuevoEstado = estado === undefined || estado === null || estado === "" ? null : (Number(estado) === 1 ? 1 : 0);
  db.query(
    "UPDATE producto SET descripcion = ?, precio_compra = ?, precio_venta = ?, stock = ?, cod_unidad = ?, estado = COALESCE(?, estado) WHERE cod_producto = ?",
    [descripcion, precio_compra, precio_venta, stock, cod_unidad, nuevoEstado, cod_producto],
    (err, results) => {
      if (err) return res.status(500).json(err);
      if (results.affectedRows === 0) return res.status(404).json({ error: "Producto no encontrado" });
      res.json({ message: "Producto actualizado correctamente" });
    }
  );
});

// Cambiar solo el estado del producto (1 = Activo, 0 = Inactivo)
router.patch("/:cod_producto/estado", (req, res) => {
  const { cod_producto } = req.params;
  const { estado } = req.body;
  if (estado === undefined || ![0, 1].includes(Number(estado))) {
    return res.status(400).json({ error: "El estado debe ser 1 (Activo) o 0 (Inactivo)" });
  }
  db.query(
    "UPDATE producto SET estado = ? WHERE cod_producto = ?",
    [Number(estado), cod_producto],
    (err, results) => {
      if (err) return res.status(500).json(err);
      if (results.affectedRows === 0) return res.status(404).json({ error: "Producto no encontrado" });
      res.json({ message: Number(estado) === 1 ? "Producto activado" : "Producto desactivado" });
    }
  );
});

module.exports = router;