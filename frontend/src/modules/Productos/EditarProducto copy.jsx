import React, { useEffect, useState } from "react";
import axios from "axios";
import Alert from "react-bootstrap/Alert";
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Table from 'react-bootstrap/Table';
import InputGroup from 'react-bootstrap/InputGroup';
import Card from 'react-bootstrap/Card';
import "./Productos.css"; // Usa los mismos estilos de productos

export const EditarProducto = () => {
  const [productos, setProductos] = useState([]);
  const [filteredProductos, setFilteredProductos] = useState([]);
  const [selectedProducto, setSelectedProducto] = useState(null);
  const [formData, setFormData] = useState({
    cod_producto: "",
    descripcion: "",
    precio_compra: "",
    precio_venta: "",
    stock: "",
    cod_unidad: "",
  });
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchProductos();
  }, []);

  const fetchProductos = () => {
    axios.get("http://localhost:4000/productos")
      .then(response => {
        setProductos(response.data);
        setFilteredProductos(response.data);
      })
      .catch(error => console.error("Error:", error));
  };

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    const filtered = productos.filter(producto => 
      producto.descripcion.toLowerCase().includes(term) || 
      producto.cod_producto.toString().includes(term)
    );
    setFilteredProductos(filtered);
  };

  const handleSelectProducto = (producto) => {
    setSelectedProducto(producto);
    setFormData(producto);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    axios.put(`http://localhost:4000/productos/${formData.cod_producto}`, formData)
      .then(() => {
        fetchProductos(); // Recargar la lista de productos
        setShowAlert(true);
        setAlertMessage("Producto actualizado correctamente");
        setTimeout(() => setShowAlert(false), 3000);
        setSelectedProducto(null);
        setFormData({ cod_producto: "", descripcion: "", precio_compra: "", precio_venta: "", stock: "", cod_unidad: "" });
      })
      .catch(error => console.error("Error al actualizar producto:", error));
  };

  return (
    <div className="container mt-4">
      <h1 className="mb-4">Editar Producto</h1>

      {/* Alerta de éxito */}
      {showAlert && (
        <Alert variant="success" dismissible onClose={() => setShowAlert(false)}>
          {alertMessage}
        </Alert>
      )}

      {/* Barra de búsqueda con Bootstrap */}
      <Card className="mb-4">
        <Card.Header className="bg-primary text-white">
          <h5 className="mb-0">Buscar Producto</h5>
        </Card.Header>
        <Card.Body>
          <InputGroup className="mb-3">
            <Form.Control
              placeholder="Buscar producto por nombre o código"
              value={searchTerm}
              onChange={handleSearch}
            />
            <Button variant="outline-secondary">
              Buscar
            </Button>
          </InputGroup>
        </Card.Body>
      </Card>

      {/* Lista de productos filtrados con Bootstrap */}
      <Card className="mb-4">
        <Card.Header className="bg-info text-white">
          <h5 className="mb-0">Resultados de la Búsqueda</h5>
        </Card.Header>
        <Card.Body>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Código</th>
                <th>Descripción</th>
                <th>Precio Venta</th>
                <th>Stock</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProductos.map(producto => (
                <tr key={producto.cod_producto}>
                  <td>{producto.cod_producto}</td>
                  <td>{producto.descripcion}</td>
                  <td>Q{parseFloat(producto.precio_venta).toFixed(2)}</td>
                  <td>{producto.stock}</td>
                  <td>
                    <Button 
                      variant="primary" 
                      size="sm" 
                      onClick={() => handleSelectProducto(producto)}
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

      {/* Formulario para modificar producto con Bootstrap */}
      {selectedProducto && (
        <Card>
          <Card.Header className="bg-warning text-dark">
            <h5 className="mb-0">Modificar Producto: {selectedProducto.descripcion}</h5>
          </Card.Header>
          <Card.Body>
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3" controlId="formDescripcion">
                <Form.Label>Descripción</Form.Label>
                <Form.Control 
                  type="text" 
                  name="descripcion" 
                  placeholder="Descripción del producto" 
                  value={formData.descripcion} 
                  onChange={handleChange} 
                  required 
                />
              </Form.Group>

              <Row className="mb-3">
                <Form.Group as={Col} controlId="formPrecioCompra">
                  <Form.Label>Precio de Compra</Form.Label>
                  <Form.Control 
                    type="number" 
                    step="0.01" 
                    name="precio_compra" 
                    placeholder="0.00" 
                    value={formData.precio_compra} 
                    onChange={handleChange} 
                    required 
                  />
                </Form.Group>

                <Form.Group as={Col} controlId="formPrecioVenta">
                  <Form.Label>Precio de Venta</Form.Label>
                  <Form.Control 
                    type="number" 
                    step="0.01" 
                    name="precio_venta" 
                    placeholder="0.00" 
                    value={formData.precio_venta} 
                    onChange={handleChange} 
                    required 
                  />
                </Form.Group>
              </Row>

              <Row className="mb-3">
                <Form.Group as={Col} controlId="formStock">
                  <Form.Label>Stock</Form.Label>
                  <Form.Control 
                    type="number" 
                    name="stock" 
                    placeholder="Cantidad disponible" 
                    value={formData.stock} 
                    onChange={handleChange} 
                    required 
                  />
                </Form.Group>

                <Form.Group as={Col} controlId="formCodUnidad">
                  <Form.Label>Código de Unidad</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="cod_unidad" 
                    placeholder="Unidad de medida" 
                    value={formData.cod_unidad} 
                    onChange={handleChange} 
                    required 
                  />
                </Form.Group>
              </Row>

              <div className="d-flex gap-2">
                <Button variant="warning" type="submit">
                  Actualizar Producto
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => {
                    setSelectedProducto(null);
                    setFormData({ cod_producto: "", descripcion: "", precio_compra: "", precio_venta: "", stock: "", cod_unidad: "" });
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