// Productos.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import Alert from "react-bootstrap/Alert";
import "./Productos.css"; // Archivo CSS para estilos personalizados

export const NuevoProducto = () => {
  const [productos, setProductos] = useState([]);
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
  }, []);

  const fetchProductos = () => {
    axios.get("http://localhost:4000/productos")
      .then(response => setProductos(response.data))
      .catch(error => console.error("Error al obtener productos:", error));
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
    <div className="container">
      <h1>Gestión de Productos</h1>

      {/* Alerta de éxito */}
      {showAlert && (
        <Alert variant="success">
          <Alert.Heading>{alertMessage}</Alert.Heading>
        </Alert>
      )}

      {/* Formulario para agregar productos */}
      <form onSubmit={handleSubmit} className="producto-form">
        
        <input type="text" name="descripcion" placeholder="Descripción" value={formData.descripcion} onChange={handleChange} required />
        <input type="number" step="0.01" name="precio_compra" placeholder="Precio de Compra" value={formData.precio_compra} onChange={handleChange} required />
        <input type="number" step="0.01" name="precio_venta" placeholder="Precio de Venta" value={formData.precio_venta} onChange={handleChange} required />
        <input type="number" name="stock" placeholder="Stock" value={formData.stock} onChange={handleChange} required />
        <input type="text" name="cod_unidad" placeholder="Código de Unidad" value={formData.cod_unidad} onChange={handleChange} required />
        <button type="submit">Agregar Producto</button>
      </form>

      {/* Lista de productos */}
      <ul className="productos-list">
        {productos.map(producto => (
          <li key={producto.cod_producto}>
            {producto.descripcion} - Q{producto.precio_venta} - Stock: {producto.stock}
          </li>
        ))}
      </ul>
    </div>
  );
};

