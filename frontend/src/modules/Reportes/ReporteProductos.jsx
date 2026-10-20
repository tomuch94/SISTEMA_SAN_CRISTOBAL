// ReporteProductos.jsx
// Reporte de productos que no han actualizado su precio en un período determinado
import React, { useState, useEffect } from "react";
import axios from "axios";
import Alert from "react-bootstrap/Alert";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Table from "react-bootstrap/Table";
import InputGroup from "react-bootstrap/InputGroup";
import Badge from "react-bootstrap/Badge";
import Card from "react-bootstrap/Card";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

const OPCIONES_DIAS = [30, 60, 90, 180, 365];

// Normaliza texto: minúsculas y sin tildes, para comparar
const normalizar = (texto) =>
  (texto || "").toString().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

// "YYYY-MM-DD HH:mm" → "DD/MM/YYYY"
const formatearFecha = (texto) => {
  if (!texto) return "Sin registro";
  const [anio, mes, dia] = texto.slice(0, 10).split("-");
  return `${dia}/${mes}/${anio}`;
};

const formatearDinero = (valor) => `Q${(parseFloat(valor) || 0).toFixed(2)}`;

// Margen de ganancia sobre el precio de compra
const calcularMargen = (producto) => {
  const compra = parseFloat(producto.precio_compra) || 0;
  const venta = parseFloat(producto.precio_venta) || 0;
  return compra > 0 ? ((venta - compra) / compra) * 100 : null;
};

// Color según antigüedad del precio
const colorDias = (dias) => {
  if (dias === null) return "dark";
  if (dias >= 365) return "danger";
  if (dias >= 180) return "warning";
  return "secondary";
};

export const ReporteProductos = () => {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [dias, setDias] = useState(90);
  const [busqueda, setBusqueda] = useState("");
  const [incluirInactivos, setIncluirInactivos] = useState(false);

  useEffect(() => {
    fetchReporte();
  }, []);

  const fetchReporte = () => {
    setCargando(true);
    setError("");
    axios.get("http://localhost:4000/productos/reporte-precios")
      .then((response) => setProductos(response.data))
      .catch((err) => {
        console.error("Error al obtener reporte de productos:", err);
        setError("No se pudo generar el reporte. Verifique que se haya ejecutado el script de base de datos (fecha_actualizacion_precio).");
      })
      .finally(() => setCargando(false));
  };

  const diasMinimos = parseInt(dias, 10) || 0;
  const palabras = normalizar(busqueda).split(/\s+/).filter(Boolean);

  // Sin fecha registrada se considera desactualizado (no se sabe cuándo se actualizó)
  const resultado = productos.filter((p) => {
    const diasProducto = p.dias_sin_actualizar === null ? null : Number(p.dias_sin_actualizar);
    if (diasProducto !== null && diasProducto < diasMinimos) return false;
    if (!incluirInactivos && Number(p.estado) === 0) return false;
    const descripcion = normalizar(p.descripcion);
    return palabras.every((palabra) => descripcion.includes(palabra));
  });

  const conFecha = resultado.filter((p) => p.dias_sin_actualizar !== null);
  const promedioDias = conFecha.length
    ? Math.round(conFecha.reduce((acc, p) => acc + Number(p.dias_sin_actualizar), 0) / conFecha.length)
    : 0;
  const maximoDias = conFecha.reduce((max, p) => Math.max(max, Number(p.dias_sin_actualizar)), 0);
  const activos = productos.filter((p) => incluirInactivos || Number(p.estado) !== 0).length;

  const exportarCSV = () => {
    const encabezado = ["Código", "Descripción", "Unidad", "Precio compra", "Precio venta", "Margen %", "Última actualización", "Días sin actualizar"];
    const filas = resultado.map((p) => {
      const margen = calcularMargen(p);
      return [
        p.cod_producto,
        p.descripcion,
        p.medida || "",
        (parseFloat(p.precio_compra) || 0).toFixed(2),
        (parseFloat(p.precio_venta) || 0).toFixed(2),
        margen === null ? "" : margen.toFixed(1),
        formatearFecha(p.fecha_actualizacion_precio),
        p.dias_sin_actualizar === null ? "" : p.dias_sin_actualizar,
      ];
    });
    const escapar = (valor) => `"${String(valor).replace(/"/g, '""')}"`;
    const csv = [encabezado, ...filas].map((fila) => fila.map(escapar).join(",")).join("\r\n");
    // BOM para que Excel reconozca los acentos
    const url = window.URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `productos_sin_actualizar_${diasMinimos}_dias.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="container mt-4" translate="no">
      <h1 className="mb-1">Reporte de Productos</h1>
      <p className="text-muted mb-4">Productos que no han actualizado su precio de compra o de venta.</p>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Filtros */}
      <Row className="g-3 mb-3 align-items-end d-print-none">
        <Form.Group as={Col} xs={12} md={4} controlId="filtroDias">
          <Form.Label>Sin actualizar en los últimos</Form.Label>
          <InputGroup>
            <Form.Control
              type="number"
              min="0"
              list="opcionesDias"
              value={dias}
              onChange={(e) => setDias(e.target.value)}
            />
            <InputGroup.Text>días</InputGroup.Text>
          </InputGroup>
          <datalist id="opcionesDias">
            {OPCIONES_DIAS.map((d) => <option key={d} value={d} />)}
          </datalist>
        </Form.Group>

        <Form.Group as={Col} xs={12} md={5} controlId="filtroDescripcion">
          <Form.Label>Descripción</Form.Label>
          <Form.Control
            placeholder="Filtrar por descripción"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            autoComplete="off"
          />
        </Form.Group>

        <Col xs={12} md={3}>
          <Form.Check
            type="switch"
            id="filtroInactivos"
            label="Incluir productos inactivos"
            checked={incluirInactivos}
            onChange={(e) => setIncluirInactivos(e.target.checked)}
          />
        </Col>
      </Row>

      <div className="mb-3 d-flex flex-wrap gap-2 d-print-none">
        {OPCIONES_DIAS.map((d) => (
          <Button
            key={d}
            size="sm"
            variant={diasMinimos === d ? "primary" : "outline-primary"}
            onClick={() => setDias(d)}
          >
            {d >= 365 ? "1 año" : `${d} días`}
          </Button>
        ))}
        <div className="ms-auto d-flex gap-2">
          <Button size="sm" variant="outline-secondary" onClick={fetchReporte} disabled={cargando}>
            Actualizar
          </Button>
          <Button size="sm" variant="success" onClick={exportarCSV} disabled={resultado.length === 0}>
            Exportar a Excel (CSV)
          </Button>
          <Button size="sm" variant="secondary" onClick={() => window.print()} disabled={resultado.length === 0}>
            Imprimir
          </Button>
        </div>
      </div>

      {/* Resumen */}
      <Row className="g-3 mb-3">
        <Col xs={12} md={4}>
          <Card body>
            <div className="text-muted small">Productos sin actualizar</div>
            <div className="fs-3 fw-bold">{`${resultado.length} de ${activos}`}</div>
          </Card>
        </Col>
        <Col xs={6} md={4}>
          <Card body>
            <div className="text-muted small">Promedio sin actualizar</div>
            <div className="fs-3 fw-bold">{`${promedioDias} días`}</div>
          </Card>
        </Col>
        <Col xs={6} md={4}>
          <Card body>
            <div className="text-muted small">Precio más antiguo</div>
            <div className="fs-3 fw-bold">{`${maximoDias} días`}</div>
          </Card>
        </Col>
      </Row>

      {/* Detalle */}
      <Table striped bordered hover responsive size="sm">
        <thead>
          <tr>
            <th>Código</th>
            <th>Descripción</th>
            <th>Unidad</th>
            <th className="text-end">Precio compra</th>
            <th className="text-end">Precio venta</th>
            <th className="text-end">Margen</th>
            <th>Última actualización</th>
            <th className="text-center">Días sin actualizar</th>
          </tr>
        </thead>
        <tbody>
          {cargando && (
            <tr>
              <td colSpan="8" className="text-center text-muted">Generando reporte...</td>
            </tr>
          )}
          {!cargando && resultado.length === 0 && (
            <tr>
              <td colSpan="8" className="text-center text-muted">
                {`Todos los productos tienen el precio actualizado en los últimos ${diasMinimos} días.`}
              </td>
            </tr>
          )}
          {!cargando && resultado.map((p) => {
            const margen = calcularMargen(p);
            const diasProducto = p.dias_sin_actualizar === null ? null : Number(p.dias_sin_actualizar);
            return (
              <tr key={p.cod_producto}>
                <td>{p.cod_producto}</td>
                <td>
                  {p.descripcion}
                  {Number(p.estado) === 0 && <Badge bg="light" text="dark" className="ms-2">Inactivo</Badge>}
                </td>
                <td>{p.medida || "—"}</td>
                <td className="text-end">{formatearDinero(p.precio_compra)}</td>
                <td className="text-end">{formatearDinero(p.precio_venta)}</td>
                <td className={`text-end ${margen !== null && margen < 0 ? "text-danger fw-bold" : ""}`}>
                  {margen === null ? "—" : `${margen.toFixed(1)}%`}
                </td>
                <td>{formatearFecha(p.fecha_actualizacion_precio)}</td>
                <td className="text-center">
                  <Badge bg={colorDias(diasProducto)}>
                    {diasProducto === null ? "Sin fecha" : `${diasProducto} días`}
                  </Badge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </div>
  );
};
