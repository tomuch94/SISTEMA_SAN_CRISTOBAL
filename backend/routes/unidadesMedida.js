const express = require("express");
const router = express.Router();
const db = require("../db");

// Obtener unidades de medida
router.get("/", (req, res) => {
  db.query("SELECT * FROM unidad_medida", (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

// Insertar unidad de medida
router.post("/", (req, res) => {
console.log("POST UnidadesMedida", req.body)
  const { medida } = req.body;
  db.query(
    "INSERT INTO unidad_medida (medida) VALUES (?)",
    [medida],
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Unidad de medida agregada correctamente" });
    }
  );
});

// Editar unidad de medida
router.put("/:cod_unidad", (req, res) => {
  const { cod_unidad } = req.params;
  const { medida } = req.body;
  db.query(
    "UPDATE unidad_medida SET medida = ? WHERE cod_unidad = ?",
    [medida, cod_unidad],
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Unidad de medida actualizada correctamente" });
    }
  );
});

module.exports = router;
