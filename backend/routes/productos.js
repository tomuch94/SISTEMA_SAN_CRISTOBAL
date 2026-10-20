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

// Insertar producto
router.post("/", (req, res) => {
  console.log("POST Productos", req.body)
  const { descripcion, precio_compra, precio_venta, stock, cod_unidad } = req.body;
  db.query(
    "INSERT INTO producto (descripcion, precio_compra, precio_venta, stock, cod_unidad) VALUES (?, ?, ?, ?, ?)",
    [descripcion, precio_compra, precio_venta, stock, cod_unidad],
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Producto agregado correctamente" });
    }
  );
});

router.put("/:cod_producto", (req, res) => {
  const { cod_producto } = req.params;
  const { descripcion, precio_compra, precio_venta, stock, cod_unidad } = req.body;
  db.query(
    "UPDATE producto SET descripcion = ?, precio_compra = ?, precio_venta = ?, stock = ?, cod_unidad = ? WHERE cod_producto = ?",
    [descripcion, precio_compra, precio_venta, stock, cod_unidad, cod_producto],
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Producto actualizado correctamente" });
    }
  );
});

module.exports = router;