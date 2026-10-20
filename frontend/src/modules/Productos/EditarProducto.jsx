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
import Modal from 'react-bootstrap/Modal';
import Spinner from 'react-bootstrap/Spinner';
import "./Productos.css"; // Usa los mismos estilos de productos

// Normaliza texto: minúsculas y sin tildes, para comparar
const normalizar = (texto) =>
  (texto || "").toString().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

// estado: 1 = Activo, 0 = Inactivo. Los productos antiguos sin estado (NULL) se consideran activos
const estaActivo = (producto) =>
  producto.estado === null || producto.estado === undefined || Number(producto.estado) !== 0;

const FORM_VACIO = { cod_producto: "", descripcion: "", precio_compra: "", precio_venta: "", stock: "", cod_unidad: "", estado: 1 };

// Campos editables, para detectar si hubo cambios
const CAMPOS = ["descripcion", "precio_compra", "precio_venta", "stock", "cod_unidad", "estado"];

// Datos del producto en el formato del formulario
const aFormulario = (producto) => ({
  cod_producto: producto.cod_producto,
  descripcion: producto.descripcion || "",
  precio_compra: producto.precio_compra ?? "",
  precio_venta: producto.precio_venta ?? "",
  stock: producto.stock ?? "",
  cod_unidad: producto.cod_unidad ?? "",
  estado: estaActivo(producto) ? 1 : 0,
});

export const EditarProducto = () => {
  const [productos, setProductos] = useState([]);
  const [unidadesMedida, setUnidadesMedida] = useState([]); // Estado para almacenar las unidades de medida
  const [selectedProducto, setSelectedProducto] = useState(null);
  const [formData, setFormData] = useState(FORM_VACIO);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertVariant, setAlertVariant] = useState("success");
  const [errorModal, setErrorModal] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [cambiandoEstado, setCambiandoEstado] = useState(null);
  const [ultimoModificado, setUltimoModificado] = useState(null);

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

  const palabras = normalizar(searchTerm).split(/\s+/).filter(Boolean);
  const filteredProductos = productos.filter(producto => {
    if (filtroEstado === "activos" && !estaActivo(producto)) return false;
    if (filtroEstado === "inactivos" && estaActivo(producto)) return false;
    const texto = normalizar(`${producto.cod_producto} ${producto.descripcion}`);
    return palabras.every(palabra => texto.includes(palabra));
  });

  const totalActivos = productos.filter(estaActivo).length;
  const totalInactivos = productos.length - totalActivos;

  // ---- Ventana de modificación ----
  const original = selectedProducto ? aFormulario(selectedProducto) : FORM_VACIO;
  const hayCambios = Boolean(selectedProducto) && CAMPOS.some(campo => String(formData[campo]) !== String(original[campo]));

  const precioCompra = parseFloat(formData.precio_compra);
  const precioVenta = parseFloat(formData.precio_venta);
  const margen = precioCompra > 0 && !Number.isNaN(precioVenta) ? ((precioVenta - precioCompra) / precioCompra) * 100 : null;
  const ventaMenorCompra = !Number.isNaN(precioCompra) && !Number.isNaN(precioVenta) && precioVenta < precioCompra;

  const abrirModal = (producto) => {
    setSelectedProducto(producto);
    setFormData(aFormulario(producto));
    setErrorModal("");
  };

  const cerrarModal = () => {
    if (guardando) return;
    if (hayCambios && !window.confirm("Hay cambios sin guardar. ¿Desea descartarlos?")) return;
    setSelectedProducto(null);
    setFormData(FORM_VACIO);
    setErrorModal("");
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!hayCambios) return;

    setGuardando(true);
    setErrorModal("");
    axios.put(`http://localhost:4000/productos/${formData.cod_producto}`, formData)
      .then(() => {
        fetchProductos();
        mostrarAlerta(`Producto "${formData.descripcion}" actualizado correctamente`);
        setUltimoModificado(formData.cod_producto);
        setTimeout(() => setUltimoModificado(null), 3000);
        setSelectedProducto(null);
        setFormData(FORM_VACIO);
      })
      .catch(error => {
        console.error("Error al actualizar producto:", error);
        setErrorModal("No se pudo actualizar el producto. Intente de nuevo.");
      })
      .finally(() => setGuardando(false));
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
        setProductos(prev => prev.map(p =>
          p.cod_producto === producto.cod_producto ? { ...p, estado: activar ? 1 : 0 } : p
        ));
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

      <Card className="mb-4">
        <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Productos</h5>
          <small>{`Mostrando ${filteredProductos.length} de ${productos.length}`}</small>
        </Card.Header>
        <Card.Body>
          {/* Búsqueda y filtro */}
          <Row className="g-3 align-items-center mb-3">
            <Col xs={12} md={8}>
              <InputGroup>
                <InputGroup.Text>🔍</InputGroup.Text>
                <Form.Control
                  placeholder="Buscar producto por nombre o código"
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
            </Col>
            <Col xs={12} md={4}>
              <Form.Select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} aria-label="Filtrar por estado">
                <option value="todos">{`Todos los estados (${productos.length})`}</option>
                <option value="activos">{`Solo activos (${totalActivos})`}</option>
                <option value="inactivos">{`Solo inactivos (${totalInactivos})`}</option>
              </Form.Select>
            </Col>
          </Row>

          {/* Lista de productos */}
          <Table striped bordered hover responsive translate="no" className="align-middle mb-0">
            <thead>
              <tr>
                <th>Código</th>
                <th>Descripción</th>
                <th>Unidad</th>
                <th className="text-end">Precio Venta</th>
                <th className="text-end">Stock</th>
                <th>Estado</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProductos.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center text-muted">No se encontraron productos</td>
                </tr>
              )}
              {filteredProductos.map(producto => {
                const activo = estaActivo(producto);
                const recienModificado = ultimoModificado === producto.cod_producto;
                return (
                  <tr
                    key={producto.cod_producto}
                    className={`${activo ? "" : "text-muted"} ${recienModificado ? "table-success" : ""}`}
                    onDoubleClick={() => abrirModal(producto)}
                    style={{ cursor: "pointer" }}
                    title="Doble clic para modificar"
                  >
                    <td>{producto.cod_producto}</td>
                    <td>{producto.descripcion}</td>
                    <td>{producto.medida || "—"}</td>
                    <td className="text-end">{`Q${(parseFloat(producto.precio_venta) || 0).toFixed(2)}`}</td>
                    <td className="text-end">{producto.stock}</td>
                    <td>
                      <Badge bg={activo ? "success" : "secondary"}>{activo ? "Activo" : "Inactivo"}</Badge>
                    </td>
                    <td className="text-nowrap text-center">
                      <Button variant="primary" size="sm" className="me-2" onClick={() => abrirModal(producto)}>
                        ✏️ Modificar
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

      {/* Ventana emergente para modificar producto */}
      <Modal show={Boolean(selectedProducto)} onHide={cerrarModal} size="lg" centered backdrop="static">
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton={!guardando}>
            <Modal.Title>
              {`Modificar producto #${formData.cod_producto}`}
              {selectedProducto && (
                <div className="fs-6 text-muted fw-normal">{selectedProducto.descripcion}</div>
              )}
            </Modal.Title>
          </Modal.Header>

          <Modal.Body>
            {errorModal && <Alert variant="danger">{errorModal}</Alert>}

            <h6 className="text-uppercase text-muted small mb-2">Datos generales</h6>
            <Row className="g-3 mb-4">
              <Form.Group as={Col} xs={12} md={8} controlId="formDescripcion">
                <Form.Label>Descripción</Form.Label>
                <Form.Control
                  type="text"
                  name="descripcion"
                  placeholder="Descripción del producto"
                  value={formData.descripcion}
                  onChange={handleChange}
                  maxLength={45}
                  required
                  autoFocus
                />
                <Form.Text muted>{`${formData.descripcion.length}/45 caracteres`}</Form.Text>
              </Form.Group>

              {/* Combo box de Unidades de Medida */}
              <Form.Group as={Col} xs={12} md={4} controlId="formCodUnidad">
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

            <h6 className="text-uppercase text-muted small mb-2">Precios e inventario</h6>
            <Row className="g-3 mb-2">
              <Form.Group as={Col} xs={12} md={4} controlId="formPrecioCompra">
                <Form.Label>Precio de Compra</Form.Label>
                <InputGroup>
                  <InputGroup.Text>Q</InputGroup.Text>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0"
                    name="precio_compra"
                    placeholder="0.00"
                    value={formData.precio_compra}
                    onChange={handleChange}
                    required
                  />
                </InputGroup>
              </Form.Group>

              <Form.Group as={Col} xs={12} md={4} controlId="formPrecioVenta">
                <Form.Label>Precio de Venta</Form.Label>
                <InputGroup>
                  <InputGroup.Text>Q</InputGroup.Text>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0"
                    name="precio_venta"
                    placeholder="0.00"
                    value={formData.precio_venta}
                    onChange={handleChange}
                    isInvalid={ventaMenorCompra}
                    required
                  />
                </InputGroup>
              </Form.Group>

              <Form.Group as={Col} xs={12} md={4} controlId="formStock">
                <Form.Label>Stock</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  name="stock"
                  placeholder="Cantidad disponible"
                  value={formData.stock}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Row>

            {/* Margen calculado al momento */}
            <div className={`small mb-4 ${ventaMenorCompra ? "text-danger fw-bold" : "text-muted"}`}>
              {margen === null
                ? "Ingrese el precio de compra y de venta para ver el margen de ganancia."
                : `Margen de ganancia: ${margen.toFixed(1)}% (Q${(precioVenta - precioCompra).toFixed(2)} por unidad)${
                    ventaMenorCompra ? " — el precio de venta es menor que el de compra" : ""
                  }`}
            </div>

            <h6 className="text-uppercase text-muted small mb-2">Estado</h6>
            <Form.Check
              type="switch"
              id="formEstado"
              label={Number(formData.estado) === 1 ? "Activo" : "Inactivo (no aparecerá en nuevas prefacturas)"}
              checked={Number(formData.estado) === 1}
              onChange={(e) => setFormData({ ...formData, estado: e.target.checked ? 1 : 0 })}
            />
          </Modal.Body>

          <Modal.Footer>
            {!hayCambios && <small className="text-muted me-auto">Sin cambios</small>}
            <Button variant="outline-secondary" onClick={cerrarModal} disabled={guardando}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" disabled={!hayCambios || guardando}>
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
