const express = require("express");
const cors = require("cors");
const clienteRoutes = require("./routes/clientes");
const productoRoutes = require("./routes/productos");
const prefacturaRoutes = require("./routes/prefacturas");
const unidadesMedida = require("./routes/unidadesMedida");

const app = express();
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://frontend:3000', 
    'http://localhost:4000'
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Rutas API
app.use("/clientes", clienteRoutes);
app.use("/productos", productoRoutes);
app.use("/prefacturas", prefacturaRoutes);
app.use("/unidades-medida", unidadesMedida);

// Servidor
app.listen(4000, () => {
  console.log("Servidor ejecutándose en http://localhost:4000");
});
