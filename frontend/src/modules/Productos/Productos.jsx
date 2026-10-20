import React, { useEffect, useState } from "react";
import axios from "axios";
import Alert from "react-bootstrap/Alert";
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Table from 'react-bootstrap/Table';
import "./Productos.css"; // Archivo CSS para estilos personalizados

export const NuevoProducto = () => {
  const [productos, setProductos] = useState([]);
  const [unidadesMedida, setUnidadesMedida] = useState([]); // Estado para almacenar las unidades de medida
  const [formData, setFormData] = useState({
    descripcion: "",
    precio_compra: "",
    precio_venta: "",
    stock: "",
    cod_unidad: "",
  });
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  useEffect(() => {
    fetchProductos();
    fetchUnidadesMedida(); // Llamar a la función para obtener unidades de medida
  }, []);

  const fetchProductos = () => {
    axios.get("http://localhost:4000/productos")
      .then(response => setProductos(response.data))
      .catch(error => console.error("Error al obtener productos:", error));
  };

  const fetchUnidadesMedida = () => {
    axios.get("http://localhost:4000/unidades-medida")
      .then(response => setUnidadesMedida(response.data))
      .catch(error => console.error("Error al obtener unidades de medida:", error));
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    axios.post("http://localhost:4000/productos", formData)
      .then(() => {
        fetchProductos(); // Recargar la lista de productos
        setShowAlert(true);
        setAlertMessage("Producto agregado correctamente");
        setTimeout(() => setShowAlert(false), 3000);
        setFormData({ descripcion: "", precio_compra: "", precio_venta: "", stock: "", cod_unidad: "" });
      })
      .catch(error => console.error("Error al agregar producto:", error));
  };

  return (
    <div className="container mt-4">
      <h1 className="mb-4">Gestión de Productos</h1>

      {/* Alerta de éxito */}
      {showAlert && (
        <Alert variant="success" dismissible onClose={() => setShowAlert(false)}>
          {alertMessage}
        </Alert>
      )}

      {/* Formulario para agregar productos con Bootstrap */}
      <div className="card mb-4">
        <div className="card-header bg-primary text-white">
          <h5 className="mb-0">Añadir Nuevo Producto</h5>
        </div>
        <div className="card-body">
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

              {/* Combo box para seleccionar unidad de medida */}
              <Form.Group as={Col} controlId="formCodUnidad">
                <Form.Label>Unidad de Medida</Form.Label>
                <Form.Select 
                  name="cod_unidad" 
                  value={formData.cod_unidad} 
                  onChange={handleChange} 
                  required
                >
                  <option value="">Seleccione una unidad</option>
                  {unidadesMedida.map(unidad => (
                    <option key={unidad.cod_unidad} value={unidad.cod_unidad}>
                      {unidad.medida}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Row>

            <Button variant="primary" type="submit">
              Agregar Producto
            </Button>
          </Form>
        </div>
      </div>

      {/* Lista de productos con Bootstrap */}
      <div className="card">
        <div className="card-header bg-info text-white">
          <h5 className="mb-0">Listado de Productos</h5>
        </div>
        <div className="card-body">
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Código</th>
                <th>Descripción</th>
                <th>Precio Compra</th>
                <th>Precio Venta</th>
                <th>Stock</th>
                <th>Unidad</th>
              </tr>
            </thead>
            <tbody>
              {productos.map(producto => (
                <tr key={producto.cod_producto}>
                  <td>{producto.cod_producto}</td>
                  <td>{producto.descripcion}</td>
                  <td>Q{parseFloat(producto.precio_compra).toFixed(2)}</td>
                  <td>Q{parseFloat(producto.precio_venta).toFixed(2)}</td>
                  <td>{producto.stock}</td>
                  <td>{producto.cod_unidad}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </div>
    </div>
  );
};
