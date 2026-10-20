const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "db",
  // host: "localhost",
  user: "root",
  // password: "Passw0rd",
  password: "Passw0rd",
  database: "sancristobal",
  port:3306
});

db.connect((err) => {
  if (err) {
    console.error("Error de conexión a la base de datos:", err);
    return;
  }
  console.log("Conectado a la base de datos");
});

module.exports = db;
