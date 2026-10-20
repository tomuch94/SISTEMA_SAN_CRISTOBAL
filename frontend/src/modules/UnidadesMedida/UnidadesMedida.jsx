// UnidadesMedida.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import Alert from "react-bootstrap/Alert";
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Table from 'react-bootstrap/Table';
import Card from 'react-bootstrap/Card';
import "./UnidadMedida.css"; // Para estilos personalizados

export const InsertarUnidadMedida = () => {
  const [unidadesMedida, setUnidadesMedida] = useState([]);
  const [formData, setFormData] = useState({
    cod_unidad: "",
    medida: ""
  });
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  useEffect(() => {
    fetchUnidadesMedida();
  }, []);

  const fetchUnidadesMedida = () => {
    axios.get("http://localhost:4000/unidades-medida")
      .then(response => setUnidadesMedida(response.data))
      .catch(error => console.error("Error:", error));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    axios.post("http://localhost:4000/unidades-medida", formData)
      .then(() => {
        fetchUnidadesMedida(); // Recargar la lista de unidades de medida
        setShowAlert(true); // Mostrar alerta de éxito
        setAlertMessage("Unidad de medida agregada correctamente");
        setTimeout(() => setShowAlert(false), 3000); // Ocultar alerta después de 3 segundos
        setFormData({ medida: "" }); // Limpiar el formulario
      })
      .catch(error => console.error("Error al agregar unidad de medida:", error));
  };

  return (
    <div className="container mt-4">
      <h1 className="mb-4">Gestión de Unidades de Medida</h1>

      {/* Alerta de éxito */}
      {showAlert && (
        <Alert variant="success" dismissible onClose={() => setShowAlert(false)}>
          <Alert.Heading>{alertMessage}</Alert.Heading>
          <p>La nueva unidad de medida ha sido registrada en la base de datos.</p>
        </Alert>
      )}

      {/* Formulario para agregar unidad de medida */}
      <Card className="mb-4">
        <Card.Header className="bg-primary text-white">
          <h5 className="mb-0">Añadir Nueva Unidad de Medida</h5>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row className="mb-3">
              <Form.Group as={Col} md={6} controlId="formMedida">
                <Form.Label>Unidad de Medida</Form.Label>
                <Form.Control 
                  type="text" 
                  name="medida" 
                  placeholder="Ingrese la unidad de medida" 
                  value={formData.medida} 
                  onChange={handleChange} 
                  required 
                />
              </Form.Group>
            </Row>

            <Button variant="primary" type="submit">
              Agregar Unidad de Medida
            </Button>
          </Form>
        </Card.Body>
      </Card>

      {/* Lista de unidades de medida */}
      <Card>
        <Card.Header className="bg-info text-white">
          <h5 className="mb-0">Listado de Unidades de Medida</h5>
        </Card.Header>
        <Card.Body>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Código</th>
                <th>Unidad de Medida</th>
              </tr>
            </thead>
            <tbody>
              {unidadesMedida.map(unidad => (
                <tr key={unidad.cod_unidad}>
                  <td>{unidad.cod_unidad}</td>
                  <td>{unidad.medida}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
};
