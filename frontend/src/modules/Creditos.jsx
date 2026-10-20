// Módulo Créditos
import React, { useEffect, useState } from "react";
import axios from "axios";
export function Creditos() {
  const [creditos, setCreditos] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:4000/creditos")
      .then((response) => setCreditos(response.data))
      .catch((error) => console.error("Error al obtener créditos:", error));
  }, []);

  return (
    <div className="container">
      <div>
        <h1>Gestión de Créditos</h1>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Estado</th>
              <th>Fecha de Pago</th>
            </tr>
          </thead>
          <tbody>
            {creditos.map((credito) => (
              <tr key={credito.cod_credito}>
                <td>{credito.cod_credito}</td>
                <td>{credito.pagado ? "Pagado" : "Pendiente"}</td>
                <td>{credito.fecha_pago}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
