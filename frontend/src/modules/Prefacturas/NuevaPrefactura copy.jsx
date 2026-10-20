// NuevaPrefactura.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import Alert from "react-bootstrap/Alert";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Table from "react-bootstrap/Table";
import InputGroup from "react-bootstrap/InputGroup";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export const NuevaPrefactura = () => {
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProductos, setFilteredProductos] = useState([]);
  const [selectedProductos, setSelectedProductos] = useState([]);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [formData, setFormData] = useState({
    cod_cliente: "",
    fecha: new Date(),
    factura: "",
    total: 0,
  });

  useEffect(() => {
    fetchClientes();
    fetchProductos();
    generarCodigoFactura(); // Generar código de factura al cargar el formulario
  }, []);

  const fetchClientes = () => {
    axios.get("http://localhost:4000/clientes")
      .then(response => setClientes(response.data))
      .catch(error => console.error("Error al obtener clientes:", error));
  };

  const fetchProductos = () => {
    axios.get("http://localhost:4000/productos")
      .then(response => {
        setProductos(response.data);
        setFilteredProductos(response.data);
      })
      .catch(error => console.error("Error al obtener productos:", error));
  };

  const generarCodigoFactura = () => {
    axios.get("http://localhost:4000/prefacturas/ultimo_codigo")
      .then(response => {
        const ultimoCodigo = response.data.ultimo_codigo; // Código más reciente de la BD
        let nuevoCodigo = "COT_A1"; // Código inicial si no hay registros

        if (ultimoCodigo) {
          const match = ultimoCodigo.match(/COT_([A-Z])(\d+)/);
          if (match) {
            let letra = match[1];
            let numero = parseInt(match[2], 10) + 1;

            // Si el número llega a 10, cambiamos de letra (A → B)
            if (numero > 9) {
              letra = String.fromCharCode(letra.charCodeAt(0) + 1); // A → B, B → C...
              numero = 1;
            }
            nuevoCodigo = `COT_${letra}${numero}`;
          }
        }

        setFormData(prevState => ({ ...prevState, factura: nuevoCodigo }));
      })
      .catch(error => console.error("Error al generar código de factura:", error));
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    const filtered = productos.filter((producto) =>
      producto.descripcion.toLowerCase().includes(e.target.value.toLowerCase())
    );
    setFilteredProductos(filtered);
  };

  const handleSelectProducto = (producto) => {
    const existe = selectedProductos.find((p) => p.cod_producto === producto.cod_producto);
    if (!existe) {
      setSelectedProductos([
        ...selectedProductos, 
        { 
          ...producto, 
          precio_venta: parseFloat(producto.precio_venta) || 0, // Asegurar que es número
          cantidad: 1, 
          total: parseFloat(producto.precio_venta) || 0 
        }
      ]);
    }
  };

  const handleCantidadChange = (index, cantidad) => {
    let productosActualizados = [...selectedProductos];
    productosActualizados[index].cantidad = cantidad;
    productosActualizados[index].total = productosActualizados[index].precio_venta * cantidad;
    setSelectedProductos(productosActualizados);
    actualizarTotalPrefactura();
  };

  const actualizarTotalPrefactura = () => {
    const total = selectedProductos.reduce((acc, producto) => acc + producto.total, 0);
    setFormData({ ...formData, total });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const prefacturaData = {
      cod_cliente: formData.cod_cliente,
      fecha: formData.fecha.toISOString().split("T")[0],
      factura: 0,
      codigo_factura: formData.factura, // Añadido código_factura explícitamente
      total: formData.total,
      detalles: selectedProductos.map((p) => ({
        cod_producto: p.cod_producto,
        precio: p.precio_venta,
        cantidad: p.cantidad,
        total: p.total,
      })),
    };

    axios.post("http://localhost:4000/prefacturas", prefacturaData)
      .then(() => {
        setShowAlert(true);
        setAlertMessage("Prefactura registrada correctamente");
        setTimeout(() => setShowAlert(false), 3000);
        setSelectedProductos([]);
        setFormData({ cod_cliente: "", fecha: new Date(), factura: "", total: 0 });
        generarCodigoFactura(); // Generar un nuevo código después de registrar
      })
      .catch(error => console.error("Error al registrar prefactura:", error));
  };

  return (
    <div className="container mt-4">
      <h1 className="mb-4">Nueva Prefactura</h1>

      {showAlert && (
        <Alert variant="success">
          <Alert.Heading>{alertMessage}</Alert.Heading>
        </Alert>
      )}

      {/* Formulario para ingresar prefactura */}
      <Form onSubmit={handleSubmit}>
        <Row className="mb-3">
          <Form.Group as={Col} controlId="formFactura">
            <Form.Label>Código de Factura</Form.Label>
            <Form.Control type="text" value={formData.factura} readOnly />
          </Form.Group>

          <Form.Group as={Col} controlId="formCliente">
            <Form.Label>Cliente</Form.Label>
            <Form.Select
              name="cod_cliente"
              value={formData.cod_cliente}
              onChange={(e) => setFormData({ ...formData, cod_cliente: e.target.value })}
              required
            >
              <option value="">Seleccione un cliente</option>
              {clientes.map(cliente => (
                <option key={cliente.cod_cliente} value={cliente.cod_cliente}>
                  {cliente.nombre}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group as={Col} controlId="formFecha">
            <Form.Label>Fecha</Form.Label>
            <DatePicker
              selected={formData.fecha}
              onChange={(date) => setFormData({ ...formData, fecha: date })}
              className="form-control"
              dateFormat="yyyy-MM-dd"
            />
          </Form.Group>
        </Row>

        {/* Buscador de productos */}
        <InputGroup className="mb-3">
          <Form.Control
            placeholder="Buscar producto por descripción"
            value={searchTerm}
            onChange={handleSearch}
          />
        </InputGroup>

        {/* Lista de productos encontrados */}
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>Descripción</th>
              <th>Precio Venta</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {filteredProductos.map(producto => (
              <tr key={producto.cod_producto}>
                <td>{producto.descripcion}</td>
                <td>Q{parseFloat(producto.precio_venta || 0).toFixed(2)}</td>
                <td>
                  <Button variant="success" size="sm" onClick={() => handleSelectProducto(producto)}>
                    Agregar
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>

        {/* Detalle de la prefactura */}
        <Table striped bordered>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Precio</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {selectedProductos.map((producto, index) => (
              <tr key={producto.cod_producto}>
                <td>{producto.descripcion}</td>
                <td>
                  <Form.Control
                    type="number"
                    min="1"
                    value={producto.cantidad}
                    onChange={(e) => handleCantidadChange(index, parseInt(e.target.value))}
                  />
                </td>
                <td>Q{parseFloat(producto.precio_venta).toFixed(2)}</td>
                <td>Q{parseFloat(producto.total).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </Table>

        <h4>Total: Q{parseFloat(formData.total).toFixed(2)}</h4>
        <Button variant="primary" type="submit">Registrar Prefactura</Button>
      </Form>
    </div>
  );
};