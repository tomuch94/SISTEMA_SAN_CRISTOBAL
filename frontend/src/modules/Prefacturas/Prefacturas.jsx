// Módulo Prefacturas
import React, { useState, useEffect } from "react";
import axios from "axios";
export function Prefacturas() {
  const [prefacturas, setPrefacturas] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:4000/prefacturas")
      .then((response) => setPrefacturas(response.data))
      .catch((error) => console.error("Error al obtener prefacturas:", error));
  }, []);

  return (
    <div className="container">
      <div>
        <h1>Gestión de Prefacturas</h1>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Cliente</th>
              <th>Total</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {prefacturas.map((prefactura) => (
              <tr key={prefactura.cod_factura}>
                <td>{prefactura.cod_factura}</td>
                <td>{prefactura.cod_cliente}</td>
                <td>{prefactura.total}</td>
                <td>{prefactura.fecha}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
