import React, { useEffect, useState } from "react";
import axios from "axios";
import Alert from "react-bootstrap/Alert";
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
    <div className="container">
      <h1>Editar Producto</h1>

      {/* Alerta de éxito */}
      {showAlert && (
        <Alert variant="success">
          <Alert.Heading>{alertMessage}</Alert.Heading>
        </Alert>
      )}

      {/* Barra de búsqueda */}
      <input 
        type="text" 
        placeholder="Buscar producto por nombre o código" 
        value={searchTerm} 
        onChange={handleSearch} 
        className="search-bar"
      />

      {/* Lista de productos filtrados */}
      <ul className="productos-list">
        {filteredProductos.map(producto => (
          <li key={producto.cod_producto}>
            {producto.descripcion} - Q{producto.precio_venta} - Stock: {producto.stock}
            <button className="edit-button" onClick={() => handleSelectProducto(producto)}>Seleccionar</button>
          </li>
        ))}
      </ul>

      {/* Formulario para modificar producto */}
      {selectedProducto && (
        <form onSubmit={handleSubmit} className="producto-form">
          <input type="text" name="descripcion" placeholder="Descripción" value={formData.descripcion} onChange={handleChange} required />
          <input type="number" step="0.01" name="precio_compra" placeholder="Precio de Compra" value={formData.precio_compra} onChange={handleChange} required />
          <input type="number" step="0.01" name="precio_venta" placeholder="Precio de Venta" value={formData.precio_venta} onChange={handleChange} required />
          <input type="number" name="stock" placeholder="Stock" value={formData.stock} onChange={handleChange} required />
          <input type="text" name="cod_unidad" placeholder="Código de Unidad" value={formData.cod_unidad} onChange={handleChange} required />
          <button type="submit">Actualizar Producto</button>
        </form>
      )}
    </div>
  );
};
