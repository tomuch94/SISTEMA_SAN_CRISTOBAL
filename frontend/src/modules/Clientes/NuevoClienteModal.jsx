// NuevoClienteModal.jsx
// Ventana emergente para registrar un cliente sin salir de la pantalla actual (p. ej. Nueva Prefactura).
// Al guardar llama a onCreado(cliente) con el cliente ya registrado (incluye cod_cliente).
import React, { useEffect, useState } from "react";
import axios from "axios";
import Alert from "react-bootstrap/Alert";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Modal from "react-bootstrap/Modal";
import Spinner from "react-bootstrap/Spinner";

const normalizar = (texto) =>
  (texto || "").toString().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

// NIT sin guiones ni espacios: "4490734-6" → "44907346"
const normalizarNit = (nit) => normalizar(nit).replace(/[^a-z0-9]/g, "");

const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const FORM_VACIO = { nombre: "", nit: "", direccion: "", telefono: "", email: "" };

export const NuevoClienteModal = ({ show, onHide, onCreado, datosIniciales = {}, clientes = [] }) => {
  const [formData, setFormData] = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [intentoGuardar, setIntentoGuardar] = useState(false);

  // Al abrir, se limpia el formulario y se precargan los datos sugeridos (lo que se escribió en el buscador)
  useEffect(() => {
    if (show) {
      setFormData({ ...FORM_VACIO, ...datosIniciales });
      setError("");
      setIntentoGuardar(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Validaciones (teléfono y correo son opcionales, como en la base de datos)
  const faltaNombre = !formData.nombre.trim();
  const faltaNit = !formData.nit.trim();
  const faltaDireccion = !formData.direccion.trim();
  const emailError = formData.email.trim() && !EMAIL_PATTERN.test(formData.email.trim())
    ? "Correo electrónico no válido"
    : "";
  const digitosTelefono = formData.telefono.replace(/\D/g, "");
  const telefonoError = digitosTelefono && digitosTelefono.length !== 8
    ? "El teléfono debe tener 8 dígitos"
    : "";
  const formularioValido = !faltaNombre && !faltaNit && !faltaDireccion && !emailError && !telefonoError;

  // Si el NIT ya existe se ofrece usar ese cliente en lugar de duplicarlo ("CF" puede repetirse)
  const nitNormalizado = normalizarNit(formData.nit);
  const clienteExistente = nitNormalizado && nitNormalizado !== "cf"
    ? clientes.find((c) => normalizarNit(c.nit) === nitNormalizado)
    : null;

  const hayDatos = Object.values(formData).some((valor) => valor.trim());

  const cerrar = () => {
    if (guardando) return;
    if (hayDatos && !window.confirm("¿Desea cancelar el registro del cliente? Se perderán los datos ingresados.")) return;
    onHide();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation(); // Evita que se envíe el formulario de la prefactura que está detrás
    setIntentoGuardar(true);
    if (!formularioValido) return;

    setGuardando(true);
    setError("");
    axios.post("http://localhost:4000/clientes", formData)
      .then(({ data }) => {
        const cliente = data.cliente || { ...formData, cod_cliente: data.cod_cliente };
        onCreado(cliente);
      })
      .catch((err) => {
        console.error("Error al registrar cliente:", err);
        const mensaje = err.response && err.response.data && err.response.data.error;
        setError(mensaje || "No se pudo registrar el cliente. Intente de nuevo.");
      })
      .finally(() => setGuardando(false));
  };

  return (
    <Modal show={show} onHide={cerrar} size="lg" centered backdrop="static">
      <Form onSubmit={handleSubmit} noValidate>
        <Modal.Header closeButton={!guardando}>
          <Modal.Title>Registrar nuevo cliente</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          {clienteExistente && (
            <Alert variant="warning" className="d-flex justify-content-between align-items-center gap-2">
              <span>{`Ya existe un cliente con este NIT: "${clienteExistente.nombre}".`}</span>
              <Button size="sm" variant="warning" onClick={() => onCreado(clienteExistente)}>
                Usar este cliente
              </Button>
            </Alert>
          )}

          <h6 className="text-uppercase text-muted small mb-2">Datos del cliente</h6>
          <Row className="g-3 mb-4">
            <Form.Group as={Col} xs={12} md={4} controlId="nuevoClienteNit">
              <Form.Label>NIT *</Form.Label>
              <Form.Control
                type="text"
                name="nit"
                placeholder="1234567-8 o CF"
                value={formData.nit}
                onChange={handleChange}
                maxLength={45}
                isInvalid={intentoGuardar && faltaNit}
                autoFocus={!formData.nit}
              />
              <Form.Control.Feedback type="invalid">El NIT es obligatorio (use CF si no tiene)</Form.Control.Feedback>
            </Form.Group>

            <Form.Group as={Col} xs={12} md={8} controlId="nuevoClienteNombre">
              <Form.Label>Nombre *</Form.Label>
              <Form.Control
                type="text"
                name="nombre"
                placeholder="Nombre completo"
                value={formData.nombre}
                onChange={handleChange}
                maxLength={255}
                isInvalid={intentoGuardar && faltaNombre}
                autoFocus={Boolean(formData.nit) && !formData.nombre}
              />
              <Form.Control.Feedback type="invalid">El nombre es obligatorio</Form.Control.Feedback>
            </Form.Group>

            <Form.Group as={Col} xs={12} controlId="nuevoClienteDireccion">
              <Form.Label>Dirección *</Form.Label>
              <Form.Control
                type="text"
                name="direccion"
                placeholder="Dirección completa"
                value={formData.direccion}
                onChange={handleChange}
                maxLength={255}
                isInvalid={intentoGuardar && faltaDireccion}
                autoFocus={Boolean(formData.nit) && Boolean(formData.nombre)}
              />
              <Form.Control.Feedback type="invalid">La dirección es obligatoria</Form.Control.Feedback>
            </Form.Group>
          </Row>

          <h6 className="text-uppercase text-muted small mb-2">Contacto (opcional)</h6>
          <Row className="g-3">
            <Form.Group as={Col} xs={12} md={5} controlId="nuevoClienteTelefono">
              <Form.Label>Teléfono</Form.Label>
              <Form.Control
                type="tel"
                name="telefono"
                placeholder="2474-6174"
                value={formData.telefono}
                onChange={handleChange}
                isInvalid={!!telefonoError}
              />
              <Form.Control.Feedback type="invalid">{telefonoError}</Form.Control.Feedback>
            </Form.Group>

            <Form.Group as={Col} xs={12} md={7} controlId="nuevoClienteEmail">
              <Form.Label>Correo Electrónico</Form.Label>
              <Form.Control
                type="email"
                name="email"
                placeholder="ejemplo@correo.com"
                value={formData.email}
                onChange={handleChange}
                maxLength={45}
                isInvalid={!!emailError}
              />
              <Form.Control.Feedback type="invalid">{emailError}</Form.Control.Feedback>
            </Form.Group>
          </Row>
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
              "Registrar y seleccionar"
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};
