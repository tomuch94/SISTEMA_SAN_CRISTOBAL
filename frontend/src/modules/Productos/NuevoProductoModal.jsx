// NuevoProductoModal.jsx
// Ventana emergente para registrar un producto sin salir de la pantalla actual (p. ej. Nueva Prefactura).
// Al guardar llama a onCreado(producto) con el producto ya registrado (incluye cod_producto y medida).
import React, { useEffect, useState } from "react";
import axios from "axios";
import Alert from "react-bootstrap/Alert";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import InputGroup from "react-bootstrap/InputGroup";
import Modal from "react-bootstrap/Modal";
import Spinner from "react-bootstrap/Spinner";

const normalizar = (texto) =>
  (texto || "").toString().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

const FORM_VACIO = { descripcion: "", precio_compra: "", precio_venta: "", stock: "0", cod_unidad: "" };

export const NuevoProductoModal = ({ show, onHide, onCreado, descripcionInicial = "", productos = [], textoBoton = "Registrar producto" }) => {
  const [formData, setFormData] = useState(FORM_VACIO);
  const [unidadesMedida, setUnidadesMedida] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [intentoGuardar, setIntentoGuardar] = useState(false);

  // Al abrir: limpiar el formulario, precargar la descripción buscada y cargar las unidades de medida
  useEffect(() => {
    if (!show) return;
    setFormData({ ...FORM_VACIO, descripcion: descripcionInicial.slice(0, 45) });
    setError("");
    setIntentoGuardar(false);
    axios.get("http://localhost:4000/unidades-medida")
      .then((response) => setUnidadesMedida(response.data))
      .catch((err) => console.error("Error al obtener unidades de medida:", err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Validaciones
  const esNumeroValido = (valor) => valor !== "" && !Number.isNaN(Number(valor)) && Number(valor) >= 0;
  const faltaDescripcion = !formData.descripcion.trim();
  const faltaUnidad = !formData.cod_unidad;
  const compraInvalida = !esNumeroValido(formData.precio_compra);
  const ventaInvalida = !esNumeroValido(formData.precio_venta);
  const stockInvalido = !esNumeroValido(formData.stock);
  const formularioValido = !faltaDescripcion && !faltaUnidad && !compraInvalida && !ventaInvalida && !stockInvalido;

  const precioCompra = parseFloat(formData.precio_compra);
  const precioVenta = parseFloat(formData.precio_venta);
  const margen = precioCompra > 0 && !Number.isNaN(precioVenta) ? ((precioVenta - precioCompra) / precioCompra) * 100 : null;
  const ventaMenorCompra = !Number.isNaN(precioCompra) && !Number.isNaN(precioVenta) && precioVenta < precioCompra;

  // Si ya existe un producto con la misma descripción se ofrece usarlo en lugar de duplicarlo
  const productoExistente = formData.descripcion.trim()
    ? productos.find((p) => normalizar(p.descripcion) === normalizar(formData.descripcion))
    : null;

  const hayDatos = formData.descripcion.trim() || formData.precio_compra || formData.precio_venta || formData.cod_unidad;

  const cerrar = () => {
    if (guardando) return;
    if (hayDatos && !window.confirm("¿Desea cancelar el registro del producto? Se perderán los datos ingresados.")) return;
    onHide();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation(); // Evita que se envíe el formulario de la pantalla que está detrás
    setIntentoGuardar(true);
    if (!formularioValido) return;

    setGuardando(true);
    setError("");
    axios.post("http://localhost:4000/productos", formData)
      .then(({ data }) => {
        const unidad = unidadesMedida.find((u) => String(u.cod_unidad) === String(formData.cod_unidad));
        const producto = data.producto || {
          ...formData,
          cod_producto: data.cod_producto,
          estado: 1,
          medida: unidad ? unidad.medida : "",
        };
        onCreado(producto);
      })
      .catch((err) => {
        console.error("Error al registrar producto:", err);
        const mensaje = err.response && err.response.data && err.response.data.error;
        setError(mensaje || "No se pudo registrar el producto. Intente de nuevo.");
      })
      .finally(() => setGuardando(false));
  };

  return (
    <Modal show={show} onHide={cerrar} size="lg" centered backdrop="static">
      <Form onSubmit={handleSubmit} noValidate>
        <Modal.Header closeButton={!guardando}>
          <Modal.Title>Registrar nuevo producto</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          {productoExistente && (
            <Alert variant="warning" className="d-flex justify-content-between align-items-center gap-2">
              <span>
                {`Ya existe un producto con esta descripción: "${productoExistente.descripcion}"`}
                {Number(productoExistente.estado) === 0 ? " (inactivo)" : ""}
              </span>
              {Number(productoExistente.estado) !== 0 && (
                <Button size="sm" variant="warning" onClick={() => onCreado(productoExistente)}>
                  Usar este producto
                </Button>
              )}
            </Alert>
          )}

          <h6 className="text-uppercase text-muted small mb-2">Datos generales</h6>
          <Row className="g-3 mb-4">
            <Form.Group as={Col} xs={12} md={8} controlId="nuevoProductoDescripcion">
              <Form.Label>Descripción *</Form.Label>
              <Form.Control
                type="text"
                name="descripcion"
                placeholder="Descripción del producto"
                value={formData.descripcion}
                onChange={handleChange}
                maxLength={45}
                isInvalid={intentoGuardar && faltaDescripcion}
                autoFocus={!formData.descripcion}
              />
              <Form.Control.Feedback type="invalid">La descripción es obligatoria</Form.Control.Feedback>
              <Form.Text muted>{`${formData.descripcion.length}/45 caracteres`}</Form.Text>
            </Form.Group>

            <Form.Group as={Col} xs={12} md={4} controlId="nuevoProductoUnidad">
              <Form.Label>Unidad de Medida *</Form.Label>
              <Form.Select
                name="cod_unidad"
                value={formData.cod_unidad}
                onChange={handleChange}
                isInvalid={intentoGuardar && faltaUnidad}
                autoFocus={Boolean(formData.descripcion)}
              >
                <option value="">Seleccione una unidad</option>
                {unidadesMedida.map((unidad) => (
                  <option key={unidad.cod_unidad} value={unidad.cod_unidad}>
                    {unidad.medida}
                  </option>
                ))}
              </Form.Select>
              <Form.Control.Feedback type="invalid">Seleccione la unidad de medida</Form.Control.Feedback>
            </Form.Group>
          </Row>

          <h6 className="text-uppercase text-muted small mb-2">Precios e inventario</h6>
          <Row className="g-3 mb-2">
            <Form.Group as={Col} xs={12} md={4} controlId="nuevoProductoPrecioCompra">
              <Form.Label>Precio de Compra *</Form.Label>
              <InputGroup hasValidation>
                <InputGroup.Text>Q</InputGroup.Text>
                <Form.Control
                  type="number"
                  step="0.01"
                  min="0"
                  name="precio_compra"
                  placeholder="0.00"
                  value={formData.precio_compra}
                  onChange={handleChange}
                  isInvalid={intentoGuardar && compraInvalida}
                />
                <Form.Control.Feedback type="invalid">Ingrese un precio válido</Form.Control.Feedback>
              </InputGroup>
            </Form.Group>

            <Form.Group as={Col} xs={12} md={4} controlId="nuevoProductoPrecioVenta">
              <Form.Label>Precio de Venta *</Form.Label>
              <InputGroup hasValidation>
                <InputGroup.Text>Q</InputGroup.Text>
                <Form.Control
                  type="number"
                  step="0.01"
                  min="0"
                  name="precio_venta"
                  placeholder="0.00"
                  value={formData.precio_venta}
                  onChange={handleChange}
                  isInvalid={(intentoGuardar && ventaInvalida) || ventaMenorCompra}
                />
                <Form.Control.Feedback type="invalid">
                  {ventaInvalida ? "Ingrese un precio válido" : "Menor que el precio de compra"}
                </Form.Control.Feedback>
              </InputGroup>
            </Form.Group>

            <Form.Group as={Col} xs={12} md={4} controlId="nuevoProductoStock">
              <Form.Label>Stock inicial *</Form.Label>
              <Form.Control
                type="number"
                min="0"
                name="stock"
                placeholder="0"
                value={formData.stock}
                onChange={handleChange}
                isInvalid={intentoGuardar && stockInvalido}
              />
              <Form.Control.Feedback type="invalid">Ingrese una cantidad válida</Form.Control.Feedback>
            </Form.Group>
          </Row>

          <div className={`small ${ventaMenorCompra ? "text-danger fw-bold" : "text-muted"}`}>
            {margen === null
              ? "Ingrese el precio de compra y de venta para ver el margen de ganancia."
              : `Margen de ganancia: ${margen.toFixed(1)}% (Q${(precioVenta - precioCompra).toFixed(2)} por unidad)`}
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="outline-secondary" onClick={cerrar} disabled={guardando}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" disabled={guardando}>
            {guardando ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                <span>Guardando...</span>
              </>
            ) : (
              textoBoton
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};
