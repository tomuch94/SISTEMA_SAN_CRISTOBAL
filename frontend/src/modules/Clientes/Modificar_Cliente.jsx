import React, { useEffect, useState } from "react";
import axios from "axios";
import Alert from "react-bootstrap/Alert";
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Table from 'react-bootstrap/Table';
import Card from 'react-bootstrap/Card';
import InputGroup from 'react-bootstrap/InputGroup';
import Modal from 'react-bootstrap/Modal';
import Spinner from 'react-bootstrap/Spinner';
import "./Clientes.css"; // Usa los mismos estilos de clientes

// Normaliza texto: minúsculas y sin tildes, para comparar
const normalizar = (texto) =>
  (texto || "").toString().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

// NIT sin guiones ni espacios: "4490734-6" → "44907346"
const normalizarNit = (nit) => normalizar(nit).replace(/[^a-z0-9]/g, "");

const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const FORM_VACIO = { cod_cliente: "", nombre: "", nit: "", direccion: "", telefono: "", email: "" };
const CAMPOS = ["nombre", "nit", "direccion", "telefono", "email"];

// Datos del cliente en el formato del formulario (los NULL pasan a texto vacío)
const aFormulario = (cliente) => ({
  cod_cliente: cliente.cod_cliente,
  nombre: cliente.nombre || "",
  nit: cliente.nit || "",
  direccion: cliente.direccion || "",
  telefono: cliente.telefono === null || cliente.telefono === undefined ? "" : String(cliente.telefono),
  email: cliente.email || "",
});

const ModificarCliente = () => {
  const [clientes, setClientes] = useState([]);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [formData, setFormData] = useState(FORM_VACIO);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertVariant, setAlertVariant] = useState("success");
  const [errorModal, setErrorModal] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [ultimoModificado, setUltimoModificado] = useState(null);

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = () => {
    axios.get("http://localhost:4000/clientes")
      .then(response => setClientes(response.data))
      .catch(error => console.error("Error:", error));
  };

  const mostrarAlerta = (mensaje, variante = "success") => {
    setAlertVariant(variante);
    setAlertMessage(mensaje);
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
  };

  // Búsqueda por nombre, NIT (con o sin guion), código, teléfono o correo
  const palabras = normalizar(searchTerm).split(/\s+/).filter(Boolean);
  const filteredClientes = clientes.filter(cliente => {
    const texto = normalizar(
      `${cliente.cod_cliente} ${cliente.nombre} ${cliente.nit} ${normalizarNit(cliente.nit)} ${cliente.telefono ?? ""} ${cliente.email ?? ""}`
    );
    return palabras.every(palabra => texto.includes(palabra));
  });

  // ---- Ventana de modificación ----
  const original = selectedCliente ? aFormulario(selectedCliente) : FORM_VACIO;
  const hayCambios = Boolean(selectedCliente) && CAMPOS.some(campo => formData[campo].trim() !== original[campo].trim());

  // Validaciones (correo y teléfono son opcionales, como en la base de datos)
  const emailError = formData.email.trim() && !EMAIL_PATTERN.test(formData.email.trim())
    ? "Correo electrónico no válido"
    : "";
  const digitosTelefono = formData.telefono.replace(/\D/g, "");
  const telefonoError = digitosTelefono && digitosTelefono.length !== 8
    ? "El teléfono debe tener 8 dígitos"
    : "";

  // Aviso si el NIT ya lo usa otro cliente ("CF" puede repetirse)
  const nitNormalizado = normalizarNit(formData.nit);
  const nitDuplicado = selectedCliente && nitNormalizado && nitNormalizado !== "cf"
    ? clientes.find(c => c.cod_cliente !== selectedCliente.cod_cliente && normalizarNit(c.nit) === nitNormalizado)
    : null;

  const abrirModal = (cliente) => {
    setSelectedCliente(cliente);
    setFormData(aFormulario(cliente));
    setErrorModal("");
  };

  const cerrarModal = () => {
    if (guardando) return;
    if (hayCambios && !window.confirm("Hay cambios sin guardar. ¿Desea descartarlos?")) return;
    setSelectedCliente(null);
    setFormData(FORM_VACIO);
    setErrorModal("");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!hayCambios || emailError || telefonoError) return;

    setGuardando(true);
    setErrorModal("");
    axios.put(`http://localhost:4000/clientes/${formData.cod_cliente}`, formData)
      .then(() => {
        fetchClientes(); // Recargar la lista de clientes
        mostrarAlerta(`Cliente "${formData.nombre.trim()}" actualizado correctamente`);
        setUltimoModificado(formData.cod_cliente);
        setTimeout(() => setUltimoModificado(null), 3000);
        setSelectedCliente(null);
        setFormData(FORM_VACIO);
      })
      .catch(error => {
        console.error("Error al actualizar cliente:", error);
        const mensaje = error.response && error.response.data && error.response.data.error;
        setErrorModal(mensaje || "No se pudo actualizar el cliente. Intente de nuevo.");
      })
      .finally(() => setGuardando(false));
  };

  // Teléfono guardado como número: 24746174 → "2474-6174"
  const formatearTelefono = (telefono) => {
    const digitos = (telefono ?? "").toString();
    return digitos.length === 8 ? `${digitos.slice(0, 4)}-${digitos.slice(4)}` : (digitos || "—");
  };

  return (
    <div className="container mt-4">
      <h1 className="mb-4">Modificar Cliente</h1>

      {/* Alerta */}
      {showAlert && (
        <Alert variant={alertVariant} dismissible onClose={() => setShowAlert(false)}>
          {alertMessage}
        </Alert>
      )}

      <Card className="mb-4">
        <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Clientes</h5>
          <small>{`Mostrando ${filteredClientes.length} de ${clientes.length}`}</small>
        </Card.Header>
        <Card.Body>
          {/* Búsqueda */}
          <InputGroup className="mb-3">
            <InputGroup.Text>🔍</InputGroup.Text>
            <Form.Control
              placeholder="Buscar cliente por nombre, NIT, teléfono o correo"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoComplete="off"
            />
            {searchTerm && (
              <Button variant="outline-secondary" onClick={() => setSearchTerm("")} title="Limpiar búsqueda">
                ✕
              </Button>
            )}
          </InputGroup>

          {/* Lista de clientes */}
          <Table striped bordered hover responsive translate="no" className="align-middle mb-0">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>NIT</th>
                <th>Dirección</th>
                <th>Teléfono</th>
                <th>Email</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredClientes.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center text-muted">
                    {searchTerm ? `No se encontraron clientes para "${searchTerm}"` : "No hay clientes registrados"}
                  </td>
                </tr>
              )}
              {filteredClientes.map(cliente => (
                <tr
                  key={cliente.cod_cliente}
                  className={ultimoModificado === cliente.cod_cliente ? "table-success" : ""}
                  onDoubleClick={() => abrirModal(cliente)}
                  style={{ cursor: "pointer" }}
                  title="Doble clic para modificar"
                >
                  <td>{cliente.cod_cliente}</td>
                  <td>{cliente.nombre}</td>
                  <td>{cliente.nit || "—"}</td>
                  <td>{cliente.direccion || "—"}</td>
                  <td className="text-nowrap">{formatearTelefono(cliente.telefono)}</td>
                  <td>{cliente.email || "—"}</td>
                  <td className="text-center">
                    <Button variant="primary" size="sm" className="text-nowrap" onClick={() => abrirModal(cliente)}>
                      ✏️ Modificar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Ventana emergente para modificar cliente */}
      <Modal show={Boolean(selectedCliente)} onHide={cerrarModal} size="lg" centered backdrop="static">
        <Form onSubmit={handleSubmit} noValidate>
          <Modal.Header closeButton={!guardando}>
            <Modal.Title>
              {`Modificar cliente #${formData.cod_cliente}`}
              {selectedCliente && (
                <div className="fs-6 text-muted fw-normal">{selectedCliente.nombre}</div>
              )}
            </Modal.Title>
          </Modal.Header>

          <Modal.Body>
            {errorModal && <Alert variant="danger">{errorModal}</Alert>}

            <h6 className="text-uppercase text-muted small mb-2">Datos del cliente</h6>
            <Row className="g-3 mb-4">
              <Form.Group as={Col} xs={12} md={8} controlId="formNombre">
                <Form.Label>Nombre *</Form.Label>
                <Form.Control
                  type="text"
                  name="nombre"
                  placeholder="Nombre completo"
                  value={formData.nombre}
                  onChange={handleChange}
                  maxLength={255}
                  isInvalid={!formData.nombre.trim()}
                  autoFocus
                />
                <Form.Control.Feedback type="invalid">El nombre es obligatorio</Form.Control.Feedback>
              </Form.Group>

              <Form.Group as={Col} xs={12} md={4} controlId="formNit">
                <Form.Label>NIT *</Form.Label>
                <Form.Control
                  type="text"
                  name="nit"
                  placeholder="1234567-8 o CF"
                  value={formData.nit}
                  onChange={handleChange}
                  maxLength={45}
                  isInvalid={!formData.nit.trim()}
                />
                <Form.Control.Feedback type="invalid">El NIT es obligatorio (use CF si no tiene)</Form.Control.Feedback>
                {nitDuplicado && (
                  <Form.Text className="text-warning">
                    {`Este NIT ya lo tiene el cliente "${nitDuplicado.nombre}"`}
                  </Form.Text>
                )}
              </Form.Group>

              <Form.Group as={Col} xs={12} controlId="formDireccion">
                <Form.Label>Dirección *</Form.Label>
                <Form.Control
                  type="text"
                  name="direccion"
                  placeholder="Dirección completa"
                  value={formData.direccion}
                  onChange={handleChange}
                  maxLength={255}
                  isInvalid={!formData.direccion.trim()}
                />
                <Form.Control.Feedback type="invalid">La dirección es obligatoria</Form.Control.Feedback>
              </Form.Group>
            </Row>

            <h6 className="text-uppercase text-muted small mb-2">Contacto (opcional)</h6>
            <Row className="g-3">
              <Form.Group as={Col} xs={12} md={5} controlId="formTelefono">
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

              <Form.Group as={Col} xs={12} md={7} controlId="formEmail">
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
            {!hayCambios && <small className="text-muted me-auto">Sin cambios</small>}
            <Button variant="outline-secondary" onClick={cerrarModal} disabled={guardando}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={
                !hayCambios || guardando || !!emailError || !!telefonoError ||
                !formData.nombre.trim() || !formData.nit.trim() || !formData.direccion.trim()
              }
            >
              {guardando ? (
                <>
                  <Spinner as="span" animation="border" size="sm" className="me-2" />
                  <span>Guardando...</span>
                </>
              ) : (
                "Guardar cambios"
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default ModificarCliente;
