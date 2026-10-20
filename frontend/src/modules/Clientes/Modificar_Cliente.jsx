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
import "./Clientes.css"; // Usa los mismos estilos de clientes

const ModificarCliente = () => {
  const [clientes, setClientes] = useState([]);
  const [filteredClientes, setFilteredClientes] = useState([]);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [formData, setFormData] = useState({
    cod_cliente: "",
    nombre: "",
    nit: "",
    direccion: "",
    telefono: "",
    email: "",
  });
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [emailError, setEmailError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = () => {
    axios.get("http://localhost:4000/clientes")
      .then(response => {
        setClientes(response.data);
        setFilteredClientes(response.data);
      })
      .catch(error => console.error("Error:", error));
  };

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    const filtered = clientes.filter(cliente => 
      cliente.nombre.toLowerCase().includes(term) || 
      cliente.nit.toLowerCase().includes(term)
    );
    setFilteredClientes(filtered);
  };

  const handleSelectCliente = (cliente) => {
    setSelectedCliente(cliente);
    setFormData(cliente);
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

    axios.put(`http://localhost:4000/clientes/${formData.cod_cliente}`, formData)
      .then(() => {
        fetchClientes(); // Recargar la lista de clientes
        setShowAlert(true);
        setAlertMessage("Cliente actualizado correctamente");
        setTimeout(() => setShowAlert(false), 3000);
        setSelectedCliente(null);
        setFormData({ cod_cliente: "", nombre: "", nit: "", direccion: "", telefono: "", email: "" });
      })
      .catch(error => console.error("Error al actualizar cliente:", error));
  };

  return (
    <div className="container mt-4">
      <h1 className="mb-4">Modificar Cliente</h1>

      {/* Alerta de éxito */}
      {showAlert && (
        <Alert variant="success" dismissible onClose={() => setShowAlert(false)}>
          {alertMessage}
        </Alert>
      )}

      {/* Barra de búsqueda con Bootstrap */}
      <Card className="mb-4">
        <Card.Header className="bg-primary text-white">
          <h5 className="mb-0">Buscar Cliente</h5>
        </Card.Header>
        <Card.Body>
          <InputGroup className="mb-3">
            <Form.Control
              placeholder="Buscar cliente por nombre o NIT"
              value={searchTerm}
              onChange={handleSearch}
            />
            <Button variant="outline-secondary">
              Buscar
            </Button>
          </InputGroup>
        </Card.Body>
      </Card>

      {/* Lista de clientes filtrados con Bootstrap */}
      <Card className="mb-4">
        <Card.Header className="bg-info text-white">
          <h5 className="mb-0">Resultados de la Búsqueda</h5>
        </Card.Header>
        <Card.Body>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Codigo</th>
                <th>Nombre</th>
                <th>NIT</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredClientes.map(cliente => (
                <tr key={cliente.cod_cliente}>
                  <td>{cliente.cod_cliente}</td>
                  <td>{cliente.nombre}</td>
                  <td>{cliente.nit}</td>
                  <td>{cliente.email}</td>
                  <td>{cliente.telefono}</td>
                  <td>
                    <Button 
                      variant="primary" 
                      size="sm" 
                      onClick={() => handleSelectCliente(cliente)}
                    >
                      Seleccionar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Formulario para modificar cliente con Bootstrap */}
      {selectedCliente && (
        <Card>
          <Card.Header className="bg-warning text-dark">
            <h5 className="mb-0">Modificar Cliente: {selectedCliente.nombre}</h5>
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
                    required 
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
                    required
                    isInvalid={!!emailError}
                  />
                  <Form.Control.Feedback type="invalid">
                    {emailError}
                  </Form.Control.Feedback>
                </Form.Group>
              </Row>

              <div className="d-flex gap-2">
                <Button variant="warning" type="submit" disabled={!!emailError}>
                  Actualizar Cliente
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => {
                    setSelectedCliente(null);
                    setFormData({ id: "", nombre: "", nit: "", direccion: "", telefono: "", email: "" });
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default ModificarCliente;