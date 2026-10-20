// 1️⃣ Crear la carpeta del proyecto y navegar dentro
mkdir backend
cd backend




// 2️⃣ Inicializar un proyecto Node.js
npm init -y


// 3️⃣ Instalar dependencias necesarias
<!-- Ejecuta el siguiente comando para instalar Express, MySQL y CORS: -->

npm install express mysql2 cors


Para desarrollo, instala nodemon:

npm install --save-dev nodemon


// 4️⃣ Configurar package.json para usar nodemon
// <!-- Abre package.json y agrega lo siguiente en "scripts": -->

"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js"
}

// <!-- Ahora puedes ejecutar el servidor con: -->

npm run dev


// 5️⃣ Crear la estructura del backend
// <!-- Ejecuta estos comandos para organizar los archivos: -->

// <!-- #este no funciona -->
// mkdir routes
// touch server.js db.js
// touch routes/clientes.js routes/productos.js routes/prefacturas.js

// <!-- Para crear el directorio: -->
New-Item -ItemType Directory -Path routes

// <!-- Para crear los archivos: -->
New-Item -ItemType File -Path server.js
New-Item -ItemType File -Path db.js
New-Item -ItemType File -Path routes/clientes.js
New-Item -ItemType File -Path routes/productos.js
New-Item -ItemType File -Path routes/prefacturas.js



// 6️⃣ Configurar la conexión a la base de datos
// Edita db.js y agrega:

const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "password",
  database: "sistema_san_cristobal",
});

db.connect((err) => {
  if (err) {
    console.error("Error de conexión a la base de datos:", err);
    return;
  }
  console.log("Conectado a la base de datos");
});

module.exports = db;


// 7️⃣ Configurar el servidor en server.js
// Copia el contenido de server.js que ya tienes en tu backend:
const express = require("express");
const cors = require("cors");
const clienteRoutes = require("./routes/clientes");
const productoRoutes = require("./routes/productos");
const prefacturaRoutes = require("./routes/prefacturas");

const app = express();
app.use(cors());
app.use(express.json());

// Rutas API
app.use("/clientes", clienteRoutes);
app.use("/productos", productoRoutes);
app.use("/prefacturas", prefacturaRoutes);

// Servidor
app.listen(4000, () => {
  console.log("Servidor ejecutándose en http://localhost:4000");
});


// 8️⃣ Crear las rutas en la carpeta routes
// Ejemplo para routes/clientes.js:

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
  const { nombre, nit, direccion, telefono } = req.body;
  db.query(
    "INSERT INTO cliente (nombre, nit, direccion, telefono) VALUES (?, ?, ?, ?)",
    [nombre, nit, direccion, telefono],
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Cliente agregado" });
    }
  );
});

module.exports = router;










