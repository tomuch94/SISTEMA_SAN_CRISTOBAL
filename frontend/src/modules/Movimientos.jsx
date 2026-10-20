// Módulo Movimientos
import React, { useEffect, useState } from "react";
import axios from "axios";
export function Movimientos() {
  const [movimientos, setMovimientos] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:4000/movimientos")
      .then((response) => setMovimientos(response.data))
      .catch((error) => console.error("Error al obtener movimientos:", error));
  }, []);

  return (
    <div className="container">
      <div>
        <h1>Gestión de Movimientos</h1>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Fecha</th>
              <th>Total</th>
              <th>Código de Crédito</th>
            </tr>
          </thead>
          <tbody>
            {movimientos.map((movimiento) => (
              <tr key={movimiento.cod_mov}>
                <td>{movimiento.cod_mov}</td>
                <td>{movimiento.fecha}</td>
                <td>{movimiento.total}</td>
                <td>{movimiento.credito_cod_credito}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
