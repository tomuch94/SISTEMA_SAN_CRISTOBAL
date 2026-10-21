// NuevaPrefactura.jsx
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Alert from "react-bootstrap/Alert";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Table from "react-bootstrap/Table";
import InputGroup from "react-bootstrap/InputGroup";
import ListGroup from "react-bootstrap/ListGroup";
import Badge from "react-bootstrap/Badge";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { NuevoClienteModal } from "../Clientes/NuevoClienteModal";
import { NuevoProductoModal } from "../Productos/NuevoProductoModal";

const MAX_SUGERENCIAS = 10;

// Normaliza texto: minúsculas y sin tildes, para comparar descripciones
const normalizar = (texto) =>
  (texto || "").toString().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

// Fecha local en formato YYYY-MM-DD (toISOString usa UTC y puede cambiar el día)
const fechaATexto = (fecha) =>
  `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;

// "YYYY-MM-DD" → Date local (new Date("YYYY-MM-DD") lo toma como UTC y puede mostrar el día anterior)
const textoAFecha = (texto) => {
  const [anio, mes, dia] = (texto || "").split("-").map(Number);
  return anio ? new Date(anio, mes - 1, dia) : new Date();
};

// Sin codFactura: registra una prefactura nueva.
// Con codFactura: carga esa prefactura y guarda los cambios (módulo de edición).
export const NuevaPrefactura = ({ codFactura = null, onVolver } = {}) => {
  const modoEdicion = Boolean(codFactura);
  const [cargando, setCargando] = useState(modoEdicion);
  const [errorCarga, setErrorCarga] = useState("");
  const [facturada, setFacturada] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [alertVariant, setAlertVariant] = useState("success");
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sugerencias, setSugerencias] = useState([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [indiceResaltado, setIndiceResaltado] = useState(-1);
  const buscadorRef = useRef(null);
  const [selectedProductos, setSelectedProductos] = useState([]);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [sugerenciasClientes, setSugerenciasClientes] = useState([]);
  const [mostrarSugerenciasClientes, setMostrarSugerenciasClientes] = useState(false);
  const [indiceClienteResaltado, setIndiceClienteResaltado] = useState(-1);
  const [errorCliente, setErrorCliente] = useState(false);
  const [mostrarNuevoCliente, setMostrarNuevoCliente] = useState(false);
  const [datosNuevoCliente, setDatosNuevoCliente] = useState({});
  const [mostrarNuevoProducto, setMostrarNuevoProducto] = useState(false);
  const [generandoPDF, setGenerandoPDF] = useState(false);
  const [formData, setFormData] = useState({
    cod_cliente: "",
    fecha: new Date(),
    factura: "",
  });

  // Total de cada línea y de la prefactura, calculados siempre desde los productos agregados
  const totalLinea = (producto) =>
    (parseFloat(producto.precio_venta) || 0) * (parseInt(producto.cantidad, 10) || 0);
  const totalPrefactura = selectedProductos.reduce((acc, producto) => acc + totalLinea(producto), 0);

  useEffect(() => {
    fetchClientes();
    fetchProductos();
    if (modoEdicion) {
      cargarPrefactura(codFactura);
    } else {
      generarCodigoFactura(); // Generar código de factura al cargar el formulario
    }
  }, [codFactura]);

  // Carga una prefactura existente con su cliente y productos
  const cargarPrefactura = (codigo) => {
    setCargando(true);
    setErrorCarga("");
    axios.get(`http://localhost:4000/prefacturas/${encodeURIComponent(codigo)}`)
      .then(({ data }) => {
        setFormData({
          cod_cliente: data.cod_cliente ? data.cod_cliente.toString() : "",
          fecha: textoAFecha(data.fecha),
          factura: data.cod_factura,
        });
        setBusquedaCliente(data.nombre ? textoCliente(data) : "");
        setFacturada(Number(data.factura) === 1);
        // Se conserva el precio con el que se cotizó, no el precio actual del producto
        setSelectedProductos((data.detalles || []).map((d) => ({
          cod_producto: d.cod_producto,
          descripcion: d.descripcion,
          medida: d.medida,
          stock: d.stock,
          precio_venta: parseFloat(d.precio) || 0,
          cantidad: parseInt(d.cantidad, 10) || 1,
        })));
      })
      .catch((error) => {
        console.error("Error al cargar prefactura:", error);
        setErrorCarga(
          error.response && error.response.status === 404
            ? `No se encontró la prefactura ${codigo}`
            : "No se pudo cargar la prefactura"
        );
      })
      .finally(() => setCargando(false));
  };

  const mostrarAlerta = (mensaje, variante = "success") => {
    setAlertVariant(variante);
    setAlertMessage(mensaje);
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 4000);
  };

  // Cuando cambia el cliente seleccionado
  useEffect(() => {
    if (formData.cod_cliente && clientes.length > 0) {
        const cliente = clientes.find(c => c.cod_cliente.toString() === formData.cod_cliente.toString());
        if (cliente) {
            setClienteSeleccionado(cliente);
            console.log("Cliente seleccionado actualizado:", cliente);
        } else {
            setClienteSeleccionado(null);
            console.log("No se encontró cliente con código:", formData.cod_cliente);
        }
    } else if (!formData.cod_cliente) {
        setClienteSeleccionado(null);
    }
}, [formData.cod_cliente, clientes]);

  // Deja solo letras y números del NIT (ignora guiones y espacios): "4490734-6" → "44907346"
  const normalizarNit = (nit) => normalizar(nit).replace(/[^a-z0-9]/g, "");

  const textoCliente = (cliente) => `${cliente.nit || "Sin NIT"} - ${cliente.nombre}`;

  const handleBusquedaCliente = (e) => {
    const valor = e.target.value;
    setBusquedaCliente(valor);
    setIndiceClienteResaltado(-1);
    // Al escribir de nuevo se quita el cliente seleccionado
    if (formData.cod_cliente) setFormData((prev) => ({ ...prev, cod_cliente: "" }));

    const nitBuscado = normalizarNit(valor);
    const palabras = normalizar(valor).split(/\s+/).filter(Boolean);
    if (palabras.length === 0) {
      setSugerenciasClientes([]);
      setMostrarSugerenciasClientes(false);
      return;
    }

    // Coincide por NIT o por nombre; primero los NIT que empiezan con lo escrito
    const coincidencias = clientes
      .filter((cliente) => {
        const nit = normalizarNit(cliente.nit);
        const nombre = normalizar(cliente.nombre);
        return (nitBuscado && nit.includes(nitBuscado)) || palabras.every((p) => nombre.includes(p));
      })
      .sort((a, b) => {
        const inicioA = nitBuscado && normalizarNit(a.nit).startsWith(nitBuscado) ? 0 : 1;
        const inicioB = nitBuscado && normalizarNit(b.nit).startsWith(nitBuscado) ? 0 : 1;
        return inicioA - inicioB || (a.nombre || "").localeCompare(b.nombre || "");
      })
      .slice(0, MAX_SUGERENCIAS);

    setSugerenciasClientes(coincidencias);
    setMostrarSugerenciasClientes(true);
  };

  const handleSelectCliente = (cliente) => {
    setErrorCliente(false);
    setFormData((prev) => ({ ...prev, cod_cliente: cliente.cod_cliente.toString() }));
    setBusquedaCliente(textoCliente(cliente));
    setSugerenciasClientes([]);
    setMostrarSugerenciasClientes(false);
    setIndiceClienteResaltado(-1);
  };

  const limpiarCliente = () => {
    setFormData((prev) => ({ ...prev, cod_cliente: "" }));
    setBusquedaCliente("");
    setSugerenciasClientes([]);
    setMostrarSugerenciasClientes(false);
    setIndiceClienteResaltado(-1);
  };

  // ---- Registro de cliente nuevo desde la prefactura ----
  const abrirNuevoCliente = () => {
    const texto = busquedaCliente.trim();
    // Si lo escrito parece un NIT (dígitos, guion, K final o CF) se precarga como NIT; si no, como nombre
    const pareceNit = /^(cf|[0-9][0-9\s-]*[0-9k])$/i.test(texto) || /^[0-9]$/.test(texto);
    setDatosNuevoCliente(
      formData.cod_cliente || !texto ? {} : pareceNit ? { nit: texto.toUpperCase() } : { nombre: texto }
    );
    setMostrarSugerenciasClientes(false);
    setMostrarNuevoCliente(true);
  };

  const handleClienteCreado = (cliente) => {
    // Agregarlo a la lista (si es nuevo) y dejarlo seleccionado en la prefactura
    setClientes((prev) =>
      prev.some((c) => c.cod_cliente === cliente.cod_cliente) ? prev : [...prev, cliente]
    );
    handleSelectCliente(cliente);
    setMostrarNuevoCliente(false);
    mostrarAlerta(`Cliente "${cliente.nombre}" seleccionado`);
  };

  const handleBusquedaClienteKeyDown = (e) => {
    if (!mostrarSugerenciasClientes || sugerenciasClientes.length === 0) {
      if (e.key === "Enter") {
        e.preventDefault(); // Evita enviar el formulario
        // Sin coincidencias: Enter abre el registro de cliente nuevo
        if (busquedaCliente.trim() && !formData.cod_cliente) abrirNuevoCliente();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndiceClienteResaltado((i) => (i + 1) % sugerenciasClientes.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndiceClienteResaltado((i) => (i <= 0 ? sugerenciasClientes.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSelectCliente(sugerenciasClientes[indiceClienteResaltado >= 0 ? indiceClienteResaltado : 0]);
    } else if (e.key === "Escape") {
      setMostrarSugerenciasClientes(false);
    }
  };

  const fetchClientes = () => {
    axios.get("http://localhost:4000/clientes")
      .then(response => setClientes(response.data))
      .catch(error => console.error("Error al obtener clientes:", error));
  };

  const fetchProductos = () => {
    axios.get("http://localhost:4000/productos")
      .then(response => setProductos(response.data))
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
    const valor = e.target.value;
    setSearchTerm(valor);
    setIndiceResaltado(-1);

    const palabras = normalizar(valor).split(/\s+/).filter(Boolean);
    if (palabras.length === 0) {
      setSugerencias([]);
      setMostrarSugerencias(false);
      return;
    }

    // Coincide si la descripción contiene todas las palabras escritas (en cualquier orden)
    const coincidencias = productos
      .filter((producto) => {
        if (producto.estado !== null && producto.estado !== undefined && Number(producto.estado) === 0) {
          return false; // Los productos inactivos no se pueden cotizar
        }
        const descripcion = normalizar(producto.descripcion);
        return palabras.every((palabra) => descripcion.includes(palabra));
      })
      // Primero las que empiezan con el texto buscado
      .sort((a, b) => {
        const inicioA = normalizar(a.descripcion).startsWith(palabras[0]) ? 0 : 1;
        const inicioB = normalizar(b.descripcion).startsWith(palabras[0]) ? 0 : 1;
        return inicioA - inicioB || (a.descripcion || "").localeCompare(b.descripcion || "");
      })
      .slice(0, MAX_SUGERENCIAS);

    setSugerencias(coincidencias);
    setMostrarSugerencias(true);
  };

  // ---- Registro de producto nuevo desde la prefactura ----
  const abrirNuevoProducto = () => {
    setMostrarSugerencias(false);
    setMostrarNuevoProducto(true);
  };

  const handleProductoCreado = (producto) => {
    // Agregarlo al catálogo (si es nuevo) y a la prefactura con cantidad 1
    setProductos((prev) =>
      prev.some((p) => p.cod_producto === producto.cod_producto) ? prev : [...prev, producto]
    );
    setMostrarNuevoProducto(false);
    handleSelectProducto(producto);
    mostrarAlerta(`Producto "${producto.descripcion}" agregado a la prefactura`);
  };

  const handleSearchKeyDown = (e) => {
    if (!mostrarSugerencias || sugerencias.length === 0) {
      if (e.key === "Enter") {
        e.preventDefault(); // Evita enviar el formulario
        // Sin coincidencias: Enter abre el registro de producto nuevo
        if (searchTerm.trim()) abrirNuevoProducto();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndiceResaltado((i) => (i + 1) % sugerencias.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndiceResaltado((i) => (i <= 0 ? sugerencias.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSelectProducto(sugerencias[indiceResaltado >= 0 ? indiceResaltado : 0]);
    } else if (e.key === "Escape") {
      setMostrarSugerencias(false);
    }
  };

  // Resalta en negrita las partes de la descripción que coinciden con la búsqueda
  const resaltarCoincidencia = (descripcion = "") => {
    const palabras = normalizar(searchTerm).split(/\s+/).filter(Boolean);
    const normal = normalizar(descripcion);
    // Si la normalización cambia la longitud no se pueden mapear posiciones; se muestra sin resaltar
    if (palabras.length === 0 || normal.length !== descripcion.length) return descripcion;
    const marcado = new Array(descripcion.length).fill(false);
    palabras.forEach((palabra) => {
      let pos = normal.indexOf(palabra);
      while (pos !== -1) {
        for (let i = pos; i < pos + palabra.length; i++) marcado[i] = true;
        pos = normal.indexOf(palabra, pos + palabra.length);
      }
    });
    const partes = [];
    let inicio = 0;
    for (let i = 1; i <= descripcion.length; i++) {
      if (i === descripcion.length || marcado[i] !== marcado[inicio]) {
        const texto = descripcion.slice(inicio, i);
        // Cada fragmento va dentro de un elemento (no texto suelto) para que React
        // pueda actualizarlo aunque el traductor del navegador modifique el DOM
        partes.push(marcado[inicio] ? <strong key={inicio}>{texto}</strong> : <span key={inicio}>{texto}</span>);
        inicio = i;
      }
    }
    return partes;
  };

  const limpiarBuscador = () => {
    setSearchTerm("");
    setSugerencias([]);
    setMostrarSugerencias(false);
    setIndiceResaltado(-1);
    if (buscadorRef.current) buscadorRef.current.focus();
  };

  const handleSelectProducto = (producto) => {
    const indiceExistente = selectedProductos.findIndex((p) => p.cod_producto === producto.cod_producto);
    let productosActualizados;

    if (indiceExistente !== -1) {
      // Si ya está en la prefactura, aumentar la cantidad
      productosActualizados = selectedProductos.map((p, i) =>
        i === indiceExistente ? { ...p, cantidad: p.cantidad + 1 } : p
      );
    } else {
      const precio = parseFloat(producto.precio_venta) || 0; // Asegurar que es número
      productosActualizados = [
        ...selectedProductos,
        { ...producto, precio_venta: precio, cantidad: 1 }
      ];
    }

    setSelectedProductos(productosActualizados);

    // Limpiar el buscador para la siguiente búsqueda
    limpiarBuscador();
  };

  const handleCantidadChange = (index, cantidad) => {
    const cantidadValida = Number.isNaN(cantidad) || cantidad < 1 ? 1 : cantidad;
    setSelectedProductos((prev) =>
      prev.map((p, i) => (i === index ? { ...p, cantidad: cantidadValida } : p))
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.cod_cliente) {
      setErrorCliente(true);
      return;
    }

    const prefacturaData = {
      cod_cliente: formData.cod_cliente,
      fecha: fechaATexto(formData.fecha),
      factura: 0,
      codigo_factura: formData.factura,
      total: totalPrefactura,
      detalles: selectedProductos.map((p) => ({
        cod_producto: p.cod_producto,
        precio: p.precio_venta,
        cantidad: p.cantidad,
        total: totalLinea(p),
      })),
    };

    if (modoEdicion) {
      setGuardando(true);
      axios.put(`http://localhost:4000/prefacturas/${encodeURIComponent(codFactura)}`, prefacturaData)
        .then(() => mostrarAlerta("Prefactura actualizada correctamente"))
        .catch((error) => {
          console.error("Error al actualizar prefactura:", error);
          const mensaje = error.response && error.response.data && error.response.data.error;
          mostrarAlerta(mensaje || "No se pudo actualizar la prefactura", "danger");
        })
        .finally(() => setGuardando(false));
      return;
    }

    axios.post("http://localhost:4000/prefacturas", prefacturaData)
      .then((response) => {
        mostrarAlerta("Prefactura registrada correctamente");

        // Generar PDF después de registrar
        generarPDF();

        // Reiniciar formulario
        setSelectedProductos([]);
        setFormData({ cod_cliente: "", fecha: new Date(), factura: "" });
        setBusquedaCliente("");
        generarCodigoFactura();
      })
      .catch(error => console.error("Error al registrar prefactura:", error));
  };

  const generarPDF = () => {
    setGenerandoPDF(true);

    // **Verificar si hay un cliente seleccionado**
    if (!clienteSeleccionado || !clienteSeleccionado.nombre) {
      console.error("No hay cliente seleccionado o los datos del cliente están vacíos:", clienteSeleccionado);
      setGenerandoPDF(false);
      return;
    }

    // Preparar los datos para enviar al localhost
    const filasProductos = selectedProductos.map(producto => ({
      descripcion: producto.descripcion,
      cantidad: producto.cantidad,
      unidad: producto.medida || 'Unidad',
      precioUnitario: parseFloat(producto.precio_venta).toFixed(2),
      total: totalLinea(producto).toFixed(2)
    }));

    const formatoFecha = new Intl.DateTimeFormat('es-GT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(formData.fecha);

    const dataPDF = {
      codigo_factura: formData.factura,
      fecha: formatoFecha,
      cliente: {
        nit: clienteSeleccionado.nit || "No registrado",
        nombre: clienteSeleccionado.nombre || "No registrado",
        contacto: clienteSeleccionado.contacto || "Ninguno",
        ciudad: clienteSeleccionado.ciudad || "Guatemala",
        telefono: clienteSeleccionado.telefono || "No registrado",
        direccion: clienteSeleccionado.direccion || "No registrada",
        email: clienteSeleccionado.email || "No registrado",
        tipo_pago: clienteSeleccionado.tipo_pago || "Efectivo"
      },
      productos: filasProductos,
      total: totalPrefactura.toFixed(2)
    };

    // **Depuración: Verificar los datos que se enviarán**
    console.log("Datos enviados para generar PDF:", dataPDF);

    // Enviar al localhost
    axios.post("http://localhost:4000/prefacturas/generar-pdf", dataPDF, { responseType: 'blob' })
      .then(response => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Cotizacion_${formData.factura}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        setGenerandoPDF(false);
      })
      .catch(error => {
        console.error("Error al generar PDF:", error);
        setGenerandoPDF(false);
      });
  };

  const handleRemoveProducto = (index) => {
    setSelectedProductos((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="mb-0">{modoEdicion ? `Editar Prefactura ${codFactura}` : "Nueva Prefactura"}</h1>
        {onVolver && (
          <Button variant="outline-secondary" onClick={onVolver}>
            ← Volver al listado
          </Button>
        )}
      </div>

      {showAlert && (
        <Alert variant={alertVariant}>
          <Alert.Heading>{alertMessage}</Alert.Heading>
        </Alert>
      )}

      {cargando && <Alert variant="info">Cargando prefactura...</Alert>}
      {errorCarga && <Alert variant="danger">{errorCarga}</Alert>}
      {facturada && (
        <Alert variant="warning">
          Esta prefactura ya fue facturada; puede consultarla y generar el PDF, pero no modificarla.
        </Alert>
      )}

      {/* Formulario para ingresar o editar la prefactura */}
      {!cargando && !errorCarga && (
      <Form onSubmit={handleSubmit}>
        <Row className="mb-3 g-3 align-items-start">
          <Form.Group as={Col} xs={12} md={3} controlId="formFactura">
            <Form.Label>Código de Factura</Form.Label>
            <Form.Control type="text" value={formData.factura} readOnly />
          </Form.Group>

          <Form.Group as={Col} xs={12} md={6} controlId="formCliente" className="position-relative">
            <Form.Label>Cliente</Form.Label>
            <InputGroup hasValidation>
              <Form.Control
                placeholder="Buscar cliente por NIT o nombre"
                value={busquedaCliente}
                onChange={handleBusquedaCliente}
                onKeyDown={handleBusquedaClienteKeyDown}
                onFocus={() => busquedaCliente.trim() && !formData.cod_cliente && setMostrarSugerenciasClientes(true)}
                onBlur={() => setMostrarSugerenciasClientes(false)}
                isValid={!!formData.cod_cliente}
                isInvalid={errorCliente && !formData.cod_cliente}
                autoComplete="off"
              />
              {busquedaCliente && (
                <Button variant="outline-secondary" onClick={limpiarCliente} title="Quitar cliente">
                  ✕
                </Button>
              )}
              <Button
                variant="outline-primary"
                onClick={abrirNuevoCliente}
                disabled={facturada}
                title="Registrar un cliente nuevo"
              >
                ➕ Nuevo
              </Button>
              <Form.Control.Feedback type="invalid">
                Seleccione un cliente de la lista o registre uno nuevo
              </Form.Control.Feedback>
            </InputGroup>

            {mostrarSugerenciasClientes && (
              <ListGroup
                translate="no"
                className="position-absolute shadow"
                style={{ zIndex: 1000, maxHeight: "320px", overflowY: "auto", left: "calc(var(--bs-gutter-x) * .5)", right: "calc(var(--bs-gutter-x) * .5)" }}
              >
                {sugerenciasClientes.length === 0 ? (
                  <ListGroup.Item className="text-muted">
                    {`No se encontraron clientes para "${busquedaCliente}"`}
                    <div className="small">Presione Enter o use la opción de abajo para registrarlo.</div>
                  </ListGroup.Item>
                ) : (
                  sugerenciasClientes.map((cliente, index) => {
                    const resaltado = index === indiceClienteResaltado;
                    return (
                      <ListGroup.Item
                        key={cliente.cod_cliente}
                        action
                        type="button"
                        active={resaltado}
                        onMouseDown={(e) => e.preventDefault()} // Evita que el input pierda el foco
                        onClick={() => handleSelectCliente(cliente)}
                        onMouseEnter={() => setIndiceClienteResaltado(index)}
                      >
                        <div><strong>{`NIT: ${cliente.nit || "Sin NIT"}`}</strong></div>
                        <small className={resaltado ? "" : "text-muted"}>{cliente.nombre}</small>
                      </ListGroup.Item>
                    );
                  })
                )}
                {/* Siempre disponible: registrar un cliente que no está en la lista */}
                <ListGroup.Item
                  action
                  type="button"
                  className="text-primary fw-semibold"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={abrirNuevoCliente}
                >
                  {`➕ Registrar nuevo cliente "${busquedaCliente.trim()}"`}
                </ListGroup.Item>
              </ListGroup>
            )}
            {clienteSeleccionado && formData.cod_cliente && (
              <Form.Text muted translate="no">
                {`${clienteSeleccionado.direccion || "Sin dirección"} · Tel: ${clienteSeleccionado.telefono || "—"}`}
              </Form.Text>
            )}
          </Form.Group>

          <Form.Group as={Col} xs={12} md={3} controlId="formFecha">
            <Form.Label>Fecha</Form.Label>
            {/* wrapperClassName: el DatePicker usa un contenedor inline-block; se fuerza a ancho completo */}
            <DatePicker
              id="formFecha"
              wrapperClassName="d-block w-100"
              selected={formData.fecha}
              onChange={(date) => setFormData((prev) => ({ ...prev, fecha: date }))}
              className="form-control"
              dateFormat="yyyy-MM-dd"
            />
          </Form.Group>
        </Row>

        {/* Buscador de productos con autocompletado */}
        <Form.Group className="mb-4 position-relative" controlId="formBuscarProducto">
          <Form.Label>Agregar producto</Form.Label>
          <InputGroup>
            <InputGroup.Text>🔍</InputGroup.Text>
            <Form.Control
              ref={buscadorRef}
              placeholder="Buscar producto por descripción"
              value={searchTerm}
              onChange={handleSearch}
              onKeyDown={handleSearchKeyDown}
              onFocus={() => searchTerm.trim() && setMostrarSugerencias(true)}
              onBlur={() => setMostrarSugerencias(false)}
              autoComplete="off"
            />
            {searchTerm && (
              <Button variant="outline-secondary" onClick={limpiarBuscador} title="Limpiar búsqueda">
                ✕
              </Button>
            )}
            <Button
              variant="outline-primary"
              onClick={abrirNuevoProducto}
              disabled={facturada}
              title="Registrar un producto nuevo"
            >
              ➕ Nuevo
            </Button>
          </InputGroup>

          {mostrarSugerencias && (
            <ListGroup
              translate="no"
              className="position-absolute w-100 shadow"
              style={{ zIndex: 1000, maxHeight: "320px", overflowY: "auto" }}
            >
              {sugerencias.length === 0 ? (
                <ListGroup.Item className="text-muted">
                  {`No se encontraron productos para "${searchTerm}"`}
                  <div className="small">Presione Enter o use la opción de abajo para registrarlo.</div>
                </ListGroup.Item>
              ) : (
                sugerencias.map((producto, index) => {
                  const enPrefactura = selectedProductos.find(
                    (p) => p.cod_producto === producto.cod_producto
                  );
                  const resaltado = index === indiceResaltado;
                  return (
                    <ListGroup.Item
                      key={producto.cod_producto}
                      action
                      type="button"
                      active={resaltado}
                      onMouseDown={(e) => e.preventDefault()} // Evita que el input pierda el foco
                      onClick={() => handleSelectProducto(producto)}
                      onMouseEnter={() => setIndiceResaltado(index)}
                      className="d-flex justify-content-between align-items-center"
                    >
                      <div>
                        <div>{resaltarCoincidencia(producto.descripcion)}</div>
                        <small className={resaltado ? "" : "text-muted"}>
                          {`${producto.medida || "Unidad"}${
                            producto.stock !== undefined && producto.stock !== null ? ` · Stock: ${producto.stock}` : ""
                          }`}
                        </small>
                      </div>
                      <div className="text-end">
                        <div>Q{parseFloat(producto.precio_venta || 0).toFixed(2)}</div>
                        {enPrefactura && (
                          <Badge bg={resaltado ? "light" : "info"} text={resaltado ? "dark" : undefined}>
                            {`En prefactura (${enPrefactura.cantidad})`}
                          </Badge>
                        )}
                      </div>
                    </ListGroup.Item>
                  );
                })
              )}
              {/* Siempre disponible: registrar un producto que no está en el catálogo */}
              <ListGroup.Item
                action
                type="button"
                className="text-primary fw-semibold"
                onMouseDown={(e) => e.preventDefault()}
                onClick={abrirNuevoProducto}
              >
                {`➕ Registrar nuevo producto "${searchTerm.trim()}"`}
              </ListGroup.Item>
            </ListGroup>
          )}
          <Form.Text muted>
            Escriba para ver coincidencias. Use ↑ ↓ y Enter para seleccionar, o ➕ Nuevo si el producto no existe.
          </Form.Text>
        </Form.Group>

        {/* Detalle de la prefactura */}
        <Table striped bordered>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Precio</th>
              <th>Total</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {selectedProductos.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center text-muted">
                  Aún no hay productos. Búsquelos arriba para agregarlos.
                </td>
              </tr>
            )}
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
                <td>{`Q${totalLinea(producto).toFixed(2)}`}</td>
                <td>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleRemoveProducto(index)}
                  >
                    Eliminar
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th colSpan="3" className="text-end">Total de la prefactura</th>
              <th colSpan="2" className="fs-5">{`Q${totalPrefactura.toFixed(2)}`}</th>
            </tr>
          </tfoot>
        </Table>

        {/* <h4>{`Total: Q${totalPrefactura.toFixed(2)}`}</h4> */}

        <Row className="mt-3">
          <Col>
            <Button
              variant="primary"
              type="submit"
              className="me-2"
              disabled={generandoPDF || guardando || facturada}
            >
              {/* Cada texto va en su propio <span> con key: React reemplaza el elemento completo,
                  así el botón se actualiza aunque el traductor del navegador haya modificado el texto */}
              {modoEdicion
                ? (guardando ? <span key="guardando">Guardando...</span> : <span key="guardar">Guardar Cambios</span>)
                : <span key="registrar">Registrar Prefactura</span>}
            </Button>

            <Button
              variant="secondary"
              onClick={generarPDF}
              disabled={selectedProductos.length === 0 || !formData.cod_cliente || generandoPDF}
            >
              {generandoPDF
                ? <span key="generando">Generando PDF...</span>
                : <span key="vista">Vista Previa PDF</span>}
            </Button>
          </Col>
        </Row>
      </Form>
      )}

      {/* Registro de cliente nuevo (fuera del formulario de la prefactura) */}
      <NuevoClienteModal
        show={mostrarNuevoCliente}
        onHide={() => setMostrarNuevoCliente(false)}
        onCreado={handleClienteCreado}
        datosIniciales={datosNuevoCliente}
        clientes={clientes}
      />

      {/* Registro de producto nuevo (fuera del formulario de la prefactura) */}
      <NuevoProductoModal
        show={mostrarNuevoProducto}
        onHide={() => setMostrarNuevoProducto(false)}
        onCreado={handleProductoCreado}
        descripcionInicial={searchTerm.trim()}
        productos={productos}
        textoBoton="Registrar y agregar"
      />
    </div>
  );
};
