// EditarPrefactura.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import Alert from "react-bootstrap/Alert";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Table from "react-bootstrap/Table";
import InputGroup from "react-bootstrap/InputGroup";
import Badge from "react-bootstrap/Badge";
import { NuevaPrefactura } from "./NuevaPrefactura";

// Normaliza texto: minúsculas y sin tildes, para comparar
const normalizar = (texto) =>
  (texto || "").toString().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

// "YYYY-MM-DD" → "DD/MM/YYYY"
const formatearFecha = (texto) => {
  const [anio, mes, dia] = (texto || "").split("-");
  return anio ? `${dia}/${mes}/${anio}` : "";
};

export const EditarPrefactura = () => {
  const [prefacturas, setPrefacturas] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [seleccionada, setSeleccionada] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPrefacturas();
  }, []);

  const fetchPrefacturas = () => {
    setCargando(true);
    setError("");
    axios.get("http://localhost:4000/prefacturas")
      .then((response) => setPrefacturas(response.data))
      .catch((err) => {
        console.error("Error al obtener prefacturas:", err);
        setError("No se pudieron cargar las prefacturas");
      })
      .finally(() => setCargando(false));
  };

  const volverAlListado = () => {
    setSeleccionada(null);
    fetchPrefacturas(); // Refrescar por si se guardaron cambios
  };

  // Busca por código, nombre del cliente, NIT (sin guiones ni espacios) o fecha
  const palabras = normalizar(busqueda).split(/\s+/).filter(Boolean);
  const prefacturasFiltradas = prefacturas.filter((p) => {
    if (palabras.length === 0) return true;
    const texto = normalizar(
      `${p.cod_factura} ${p.nombre} ${p.nit} ${(p.nit || "").replace(/[^0-9a-zA-Z]/g, "")} ${formatearFecha(p.fecha)}`
    );
    return palabras.every((palabra) => texto.includes(palabra));
  });

  if (seleccionada) {
    return <NuevaPrefactura key={seleccionada} codFactura={seleccionada} onVolver={volverAlListado} />;
  }

  return (
    <div className="container mt-4">
      <h1 className="mb-4">Modificar Prefactura</h1>

      {error && <Alert variant="danger">{error}</Alert>}

      <InputGroup className="mb-3">
        <InputGroup.Text>🔍</InputGroup.Text>
        <Form.Control
          placeholder="Buscar por código, cliente, NIT o fecha (DD/MM/AAAA)"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          autoComplete="off"
        />
        {busqueda && (
          <Button variant="outline-secondary" onClick={() => setBusqueda("")} title="Limpiar búsqueda">
            ✕
          </Button>
        )}
      </InputGroup>

      <Table striped bordered hover responsive translate="no">
        <thead>
          <tr>
            <th>Código</th>
            <th>Fecha</th>
            <th>Cliente</th>
            <th>NIT</th>
            <th className="text-end">Total</th>
            <th>Estado</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {cargando && (
            <tr>
              <td colSpan="7" className="text-center text-muted">Cargando prefacturas...</td>
            </tr>
          )}
          {!cargando && prefacturasFiltradas.length === 0 && (
            <tr>
              <td colSpan="7" className="text-center text-muted">
                {busqueda ? `No se encontraron prefacturas para "${busqueda}"` : "No hay prefacturas registradas"}
              </td>
            </tr>
          )}
          {!cargando && prefacturasFiltradas.map((p) => {
            const facturada = Number(p.factura) === 1;
            return (
              <tr key={p.cod_factura}>
                <td>{p.cod_factura}</td>
                <td>{formatearFecha(p.fecha)}</td>
                <td>{p.nombre || "—"}</td>
                <td>{p.nit || "—"}</td>
                <td className="text-end">{`Q${(parseFloat(p.total) || 0).toFixed(2)}`}</td>
                <td>
                  <Badge bg={facturada ? "secondary" : "success"}>
                    {facturada ? "Facturada" : "Pendiente"}
                  </Badge>
                </td>
                <td>
                  <Button
                    variant={facturada ? "outline-secondary" : "warning"}
                    size="sm"
                    onClick={() => setSeleccionada(p.cod_factura)}
                  >
                    {facturada ? "Ver" : "Editar"}
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </div>
  );
};
