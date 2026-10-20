// Clientes.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import Alert from "react-bootstrap/Alert";
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Table from 'react-bootstrap/Table';
import Card from 'react-bootstrap/Card';
import "./Clientes.css"; // Para estilos personalizados

const Clientes = () => {
  const [clientes, setClientes] = useState([]);
  const [formData, setFormData] = useState({
    nombre: "",
    nit: "",
    direccion: "",
    telefono: "",
    email: "",
  });
  const [showAlert, setShowAlert] = useState(false);
  const [emailError, setEmailError] = useState("");

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = () => {
    axios.get("http://localhost:4000/clientes")
      .then(response => setClientes(response.data))
      .catch(error => console.error("Error:", error));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Validación de email
    if (name === "email") {
      const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

      if (!emailPattern.test(value)) {
        setEmailError("Correo electrónico no válido");
      } else {
        setEmailError("");
      }
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (emailError) {
      return;
    }

    axios.post("http://localhost:4000/clientes", formData)
      .then(() => {
        fetchClientes(); // Recargar la lista de clientes
        setShowAlert(true); // Mostrar alerta de éxito
        setTimeout(() => setShowAlert(false), 3000); // Ocultar alerta después de 3 segundos
        setFormData({ nombre: "", nit: "", direccion: "", telefono: "", email: "" }); // Limpiar el formulario
      })
      .catch(error => console.error("Error al agregar cliente:", error));
  };

  return (
    <div className="container mt-4">
      <h1 className="mb-4">Gestión de Clientes</h1>

      {/* Alerta de éxito */}
      {showAlert && (
        <Alert variant="success" dismissible onClose={() => setShowAlert(false)}>
          <Alert.Heading>Cliente agregado correctamente</Alert.Heading>
          <p>El nuevo cliente ha sido registrado en la base de datos.</p>
        </Alert>
      )}

      {/* Formulario para agregar cliente */}
      <Card className="mb-4">
        <Card.Header className="bg-primary text-white">
          <h5 className="mb-0">Añadir Nuevo Cliente</h5>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row className="mb-3">
              <Form.Group as={Col} md={6} controlId="formNombre">
                <Form.Label>Nombre</Form.Label>
                <Form.Control 
                  type="text" 
                  name="nombre" 
                  placeholder="Nombre completo" 
                  value={formData.nombre} 
                  onChange={handleChange} 
                  required 
                />
              </Form.Group>

              <Form.Group as={Col} md={6} controlId="formNit">
                <Form.Label>NIT</Form.Label>
                <Form.Control 
                  type="text" 
                  name="nit" 
                  placeholder="NIT" 
                  value={formData.nit} 
                  onChange={handleChange} 
                  required 
                />
              </Form.Group>
            </Row>

            <Form.Group className="mb-3" controlId="formDireccion">
              <Form.Label>Dirección</Form.Label>
              <Form.Control 
                type="text" 
                name="direccion" 
                placeholder="Dirección completa" 
                value={formData.direccion} 
                onChange={handleChange} 
                required 
              />
            </Form.Group>

            <Row className="mb-3">
              <Form.Group as={Col} md={6} controlId="formTelefono">
                <Form.Label>Teléfono</Form.Label>
                <Form.Control 
                  type="text" 
                  name="telefono" 
                  placeholder="Número telefónico" 
                  value={formData.telefono} 
                  onChange={handleChange} 
                  // required 
                />
              </Form.Group>

              <Form.Group as={Col} md={6} controlId="formEmail">
                <Form.Label>Correo Electrónico</Form.Label>
                <Form.Control 
                  type="email" 
                  name="email" 
                  placeholder="ejemplo@correo.com" 
                  value={formData.email} 
                  onChange={handleChange} 
                  // required
                  isInvalid={!!emailError}
                />
                <Form.Control.Feedback type="invalid">
                  {emailError}
                </Form.Control.Feedback>
              </Form.Group>
            </Row>

            <Button variant="primary" type="submit" disabled={!!emailError}>
              Agregar Cliente
            </Button>
          </Form>
        </Card.Body>
      </Card>

      {/* Lista de clientes */}
      <Card>
        <Card.Header className="bg-info text-white">
          <h5 className="mb-0">Listado de Clientes</h5>
        </Card.Header>
        <Card.Body>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>NIT</th>
                <th>Dirección</th>
                <th>Teléfono</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map(cliente => (
                <tr key={cliente.cod_cliente}>
                  <td>{cliente.cod_cliente}</td>
                  <td>{cliente.nombre}</td>
                  <td>{cliente.nit}</td>
                  <td>{cliente.direccion}</td>
                  <td>{cliente.telefono}</td>
                  <td>{cliente.email}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Clientes;