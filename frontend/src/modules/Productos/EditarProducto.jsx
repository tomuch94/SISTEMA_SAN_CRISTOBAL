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
import Badge from 'react-bootstrap/Badge';
import "./Productos.css"; // Usa los mismos estilos de productos

// Normaliza texto: minúsculas y sin tildes, para comparar
const normalizar = (texto) =>
  (texto || "").toString().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

// estado: 1 = Activo, 0 = Inactivo. Los productos antiguos sin estado (NULL) se consideran activos
const estaActivo = (producto) =>
  producto.estado === null || producto.estado === undefined || Number(producto.estado) !== 0;

const FORM_VACIO = { cod_producto: "", descripcion: "", precio_compra: "", precio_venta: "", stock: "", cod_unidad: "", estado: 1 };

export const EditarProducto = () => {
  const [productos, setProductos] = useState([]);
  const [unidadesMedida, setUnidadesMedida] = useState([]); // Estado para almacenar las unidades de medida
  const [selectedProducto, setSelectedProducto] = useState(null);
  const [formData, setFormData] = useState(FORM_VACIO);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertVariant, setAlertVariant] = useState("success");
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [cambiandoEstado, setCambiandoEstado] = useState(null);

  useEffect(() => {
    fetchProductos();
    fetchUnidadesMedida(); // Llamar a la función para obtener unidades de medida
  }, []);

  const fetchProductos = () => {
    axios.get("http://localhost:4000/productos")
      .then(response => setProductos(response.data))
      .catch(error => console.error("Error:", error));
  };

  const fetchUnidadesMedida = () => {
    axios.get("http://localhost:4000/unidades-medida")
      .then(response => setUnidadesMedida(response.data))
      .catch(error => console.error("Error al obtener unidades de medida:", error));
  };

  const mostrarAlerta = (mensaje, variante = "success") => {
    setAlertVariant(variante);
    setAlertMessage(mensaje);
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
  };

  // La lista se filtra con el texto actual (antes usaba el valor anterior de la búsqueda)
  const palabras = normalizar(searchTerm).split(/\s+/).filter(Boolean);
  const filteredProductos = productos.filter(producto => {
    if (filtroEstado === "activos" && !estaActivo(producto)) return false;
    if (filtroEstado === "inactivos" && estaActivo(producto)) return false;
    const texto = normalizar(`${producto.cod_producto} ${producto.descripcion}`);
    return palabras.every(palabra => texto.includes(palabra));
  });

  const totalActivos = productos.filter(estaActivo).length;
  const totalInactivos = productos.length - totalActivos;

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSelectProducto = (producto) => {
    setSelectedProducto(producto);
    setFormData({ ...producto, estado: estaActivo(producto) ? 1 : 0 });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    axios.put(`http://localhost:4000/productos/${formData.cod_producto}`, formData)
      .then(() => {
        fetchProductos();
        mostrarAlerta("Producto actualizado correctamente");
        setSelectedProducto(null);
        setFormData(FORM_VACIO);
      })
      .catch(error => {
        console.error("Error al actualizar producto:", error);
        mostrarAlerta("No se pudo actualizar el producto", "danger");
      });
  };

  // Activar / desactivar directamente desde la lista
  const handleCambiarEstado = (producto) => {
    const activar = !estaActivo(producto);
    if (!activar && !window.confirm(`¿Desactivar el producto "${producto.descripcion}"?\nYa no aparecerá al buscar productos en una nueva prefactura.`)) {
      return;
    }

    setCambiandoEstado(producto.cod_producto);
    axios.patch(`http://localhost:4000/productos/${producto.cod_producto}/estado`, { estado: activar ? 1 : 0 })
      .then(() => {
        // Actualizar la lista sin recargar todo
        setProductos(prev => prev.map(p =>
          p.cod_producto === producto.cod_producto ? { ...p, estado: activar ? 1 : 0 } : p
        ));
        // Si está abierto en el formulario, reflejar el cambio
        if (selectedProducto && selectedProducto.cod_producto === producto.cod_producto) {
          setFormData(prev => ({ ...prev, estado: activar ? 1 : 0 }));
        }
        mostrarAlerta(`Producto "${producto.descripcion}" ${activar ? "activado" : "desactivado"}`);
      })
      .catch(error => {
        console.error("Error al cambiar estado del producto:", error);
        mostrarAlerta("No se pudo cambiar el estado del producto", "danger");
      })
      .finally(() => setCambiandoEstado(null));
  };

  return (
    <div className="container mt-4">
      <h1 className="mb-4">Editar Producto</h1>

      {/* Alerta */}
      {showAlert && (
        <Alert variant={alertVariant} dismissible onClose={() => setShowAlert(false)}>
          {alertMessage}
        </Alert>
      )}

      {/* Barra de búsqueda */}
      <Card className="mb-4">
        <Card.Header className="bg-primary text-white">
          <h5 className="mb-0">Buscar Producto</h5>
        </Card.Header>
        <Card.Body>
          <Row className="g-3 align-items-center">
            <Col xs={12} md={8}>
              <InputGroup>
                <Form.Control
                  placeholder="Buscar producto por nombre o código"
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </InputGroup>
            </Col>
            <Col xs={12} md={4}>
              <Form.Select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} aria-label="Filtrar por estado">
                <option value="todos">{`Todos los estados (${productos.length})`}</option>
                <option value="activos">{`Solo activos (${totalActivos})`}</option>
                <option value="inactivos">{`Solo inactivos (${totalInactivos})`}</option>
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Lista de productos */}
      <Card className="mb-4">
        <Card.Header className="bg-info text-white">
          <h5 className="mb-0">Resultados de la Búsqueda</h5>
        </Card.Header>
        <Card.Body>
          <Table striped bordered hover responsive translate="no">
            <thead>
              <tr>
                <th>Código</th>
                <th>Descripción</th>
                <th>Precio Venta</th>
                <th>Stock</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProductos.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center text-muted">No se encontraron productos</td>
                </tr>
              )}
              {filteredProductos.map(producto => {
                const activo = estaActivo(producto);
                return (
                  <tr key={producto.cod_producto} className={activo ? "" : "text-muted"}>
                    <td>{producto.cod_producto}</td>
                    <td>{producto.descripcion}</td>
                    <td>{`Q${(parseFloat(producto.precio_venta) || 0).toFixed(2)}`}</td>
                    <td>{producto.stock}</td>
                    <td>
                      <Badge bg={activo ? "success" : "secondary"}>{activo ? "Activo" : "Inactivo"}</Badge>
                    </td>
                    <td className="text-nowrap">
                      <Button variant="primary" size="sm" className="me-2" onClick={() => handleSelectProducto(producto)}>
                        Seleccionar
                      </Button>
                      <Button
                        variant={activo ? "outline-danger" : "outline-success"}
                        size="sm"
                        disabled={cambiandoEstado === producto.cod_producto}
                        onClick={() => handleCambiarEstado(producto)}
                      >
                        {activo ? "Desactivar" : "Activar"}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Formulario para modificar producto */}
      {selectedProducto && (
        <Card>
          <Card.Header className="bg-warning text-dark">
            <h5 className="mb-0">{`Modificar Producto: ${selectedProducto.descripcion}`}</h5>
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

                {/* Combo box de Unidades de Medida */}
                <Form.Group as={Col} controlId="formCodUnidad">
                  <Form.Label>Unidad de Medida</Form.Label>
                  <Form.Select name="cod_unidad" value={formData.cod_unidad} onChange={handleChange} required>
                    <option value="">Seleccione una unidad</option>
                    {unidadesMedida.map(unidad => (
                      <option key={unidad.cod_unidad} value={unidad.cod_unidad}>
                        {unidad.medida}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Row>

              {/* Estado del producto */}
              <Form.Group className="mb-3" controlId="formEstado">
                <Form.Label>Estado</Form.Label>
                <Form.Check
                  type="switch"
                  label={Number(formData.estado) === 1 ? "Activo" : "Inactivo (no aparecerá en nuevas prefacturas)"}
                  checked={Number(formData.estado) === 1}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.checked ? 1 : 0 })}
                />
              </Form.Group>

              <Button variant="warning" type="submit" className="me-2">Actualizar Producto</Button>
              <Button variant="outline-secondary" onClick={() => { setSelectedProducto(null); setFormData(FORM_VACIO); }}>
                Cancelar
              </Button>
            </Form>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};
