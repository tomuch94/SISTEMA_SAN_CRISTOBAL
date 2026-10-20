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

  if (!nombre || !nit || !direccion) {
    return res.status(400).json({ error: "Nombre, NIT y dirección son obligatorios" });
  }

  // telefono es INT en la base de datos: se guardan solo los dígitos; vacío → NULL
  const digitosTelefono = (telefono ?? "").toString().replace(/\D/g, "");
  const telefonoFinal = digitosTelefono ? Number(digitosTelefono) : null;
  // email es opcional; vacío → NULL
  const emailFinal = email && email.toString().trim() ? email.toString().trim() : null;

  db.query(
    "INSERT INTO cliente (nombre, nit, direccion, telefono, email) VALUES (?, ?, ?, ?, ?)",
    [nombre.trim(), nit.trim(), direccion.trim(), telefonoFinal, emailFinal],
    (err, results) => {
      if (err) return res.status(500).json(err);
      // Se devuelve el cliente creado para poder seleccionarlo de inmediato (p. ej. en Nueva Prefactura)
      res.json({
        message: "Cliente agregado",
        cod_cliente: results.insertId,
        cliente: {
          cod_cliente: results.insertId,
          nombre: nombre.trim(),
          nit: nit.trim(),
          direccion: direccion.trim(),
          telefono: telefonoFinal,
          email: emailFinal,
        },
      });
    }
  );
});

router.put("/:id", (req, res) => {
    console.log("Editar Cliente", req.params.id, req.body)
    // Se actualiza el cliente indicado en la URL (antes se tomaba del cuerpo de la petición)
    const cod_cliente = req.params.id;
    const { nombre, nit, direccion, telefono, email } = req.body;

    if (!nombre || !nit || !direccion) {
      return res.status(400).json({ error: "Nombre, NIT y dirección son obligatorios" });
    }

    // telefono es INT en la base de datos: se guardan solo los dígitos; vacío → NULL
    const digitosTelefono = (telefono ?? "").toString().replace(/\D/g, "");
    const telefonoFinal = digitosTelefono ? Number(digitosTelefono) : null;
    // email es opcional; vacío → NULL
    const emailFinal = email && email.toString().trim() ? email.toString().trim() : null;

    db.query(
      "UPDATE cliente SET nombre = ?, nit = ?, direccion = ?, telefono = ?, email = ? WHERE cod_cliente = ?",
      [nombre.trim(), nit.trim(), direccion.trim(), telefonoFinal, emailFinal, cod_cliente],
      (err, results) => {
        if (err) return res.status(500).json(err);
        if (results.affectedRows === 0) return res.status(404).json({ error: "Cliente no encontrado" });
        res.json({ message: "Cliente actualizado" });
      }
    );
  });
  

module.exports = router;
