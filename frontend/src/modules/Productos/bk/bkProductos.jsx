// Módulo Productos
import React, { useState, useEffect } from "react";
import axios from "axios";
export function Productos() {
  const [productos, setProductos] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:4000/productos")
      .then((response) => setProductos(response.data))
      .catch((error) => console.error("Error al obtener productos:", error));
  }, []);

  return (
    <div className="container">
      <div>
        <h1>Gestión de Productos</h1>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Descripción</th>
              <th>Precio</th>
              <th>Stock</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((producto) => (
              <tr key={producto.cod_producto}>
                <td>{producto.cod_producto}</td>
                <td>{producto.descripcion}</td>
                <td>{producto.precio_venta}</td>
                <td>{producto.stock}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
