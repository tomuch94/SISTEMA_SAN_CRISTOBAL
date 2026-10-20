const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", (req, res) => {
  db.query("SELECT * FROM cliente", (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

router.post("/", (req, res) => {
  const { nombre, nit, direccion, telefono, email } = req.body;
  db.query(
    "INSERT INTO cliente (nombre, nit, direccion, telefono, email) VALUES (?, ?, ?, ?, ?)",
    [nombre, nit, direccion, telefono, email],
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Cliente agregado" });
    }
  );
});

router.put("/:id", (req, res) => {
    console.log("Editar Cliente")
    const {cod_cliente, nombre, nit, direccion, telefono, email } = req.body;
    db.query(
      "UPDATE cliente SET nombre = ?, nit = ?, direccion = ?, telefono = ?, email = ? WHERE cod_cliente = ?",
      [nombre, nit, direccion, telefono, email, cod_cliente],
      (err, results) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Cliente actualizado" });
      }
    );
  });
  

module.exports = router;
