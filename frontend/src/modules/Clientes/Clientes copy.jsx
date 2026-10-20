import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Clientes.css"; // Para estilos personalizados

const Clientes = () => {
  const [clientes, setClientes] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:4000/clientes")
      .then(response => setClientes(response.data))
      .catch(error => console.error("Error:", error));
  }, []);

  return (
    <div className="container">
      <h1>Lista de Clientes</h1>
      <ul className="clientes-list">
        {clientes.map(cliente => (
          <li key={cliente.cod_cliente}>{cliente.nombre} - {cliente.nit}</li>
        ))}
      </ul>
    </div>
  );
};

export default Clientes;
