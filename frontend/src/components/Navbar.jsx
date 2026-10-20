// Navbar.jsx
import { Link } from "react-router-dom";
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import { sendTestMetric } from '../testMetrics';


const NavbarComponent = () => {
  
  return (
    <Navbar expand="lg" className="bg-dark" variant="dark">
      <Container>
        <Navbar.Brand as={Link} to="/">Sistema San Cristóbal</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {/* <Nav.Link as={Link} to="/clientes">Clientes</Nav.Link> */}
            {/* Menú desplegable para Reportes */}
            <NavDropdown title="Clientes" id="reportes-dropdown">
              <NavDropdown.Item as={Link} to="/clientes/nuevo">Nuevo Cliente</NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/clientes/modificar">Modificar Cliente</NavDropdown.Item>
            </NavDropdown>
            <NavDropdown title="Productos" id="reportes-dropdown">
              <NavDropdown.Item as={Link} to="/productos/nuevo">Nuevo Producto</NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/productos/modificar">Modificar Producto</NavDropdown.Item>
            </NavDropdown>
            <NavDropdown title="Cotización" id="reportes-dropdown">
              <NavDropdown.Item as={Link} to="/prefacturas/nuevo">Nueva Cotización</NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/prefacturas/modificar">Modificar Cotización</NavDropdown.Item>
            </NavDropdown>
            {/* <Nav.Link as={Link} to="/prefacturas">Prefacturas</Nav.Link> */}
            <Nav.Link as={Link} to="/creditos">Créditos</Nav.Link>
            <Nav.Link as={Link} to="/movimientos">Movimientos</Nav.Link>
            <Nav.Link as={Link} to="/unidades-medida">Unidades de Medida</Nav.Link>
            
            {/* Menú desplegable para Reportes */}
            <NavDropdown title="Reportes" id="reportes-dropdown">
              <NavDropdown.Item as={Link} to="/reportes/productos">Productos</NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/reportes/clientes">Clientes</NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/reportes/prefacturas">Prefacturas</NavDropdown.Item>
            </NavDropdown>
          </Nav>

        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavbarComponent;