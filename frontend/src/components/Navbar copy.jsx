import React, { useEffect } from 'react';
import { Link } from "react-router-dom";
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import metricsAPI from '../simplifiedMetrics'; // Importar API de métricas

const NavbarComponent = () => {
  useEffect(() => {
    // Iniciar reporte de métricas con más logging
    console.log('🚀 Iniciando métricas en Navbar');
    
    // Configurar reporte de métricas
    const stopReporting = metricsAPI.setupMetricsReporting();

    // Generar métricas de ejemplo
    metricsAPI.trackPageView('navbar');
    metricsAPI.incrementCounter('navbar_load', { page: 'navbar' });

    // Forzar un envío inmediato
    const initialMetrics = metricsAPI.formatMetricsForPrometheus();
    console.log('📊 Métricas de Navbar:', initialMetrics);

    // Limpiar al desmontar
    return () => {
      stopReporting();
    };
  }, []);

  // Función para trackear clics en elementos del navbar
  const handleNavItemClick = (item) => {
    metricsAPI.trackUserEvent('navbar_click', item);
  };

  // Función de prueba de métricas
  const handleTestMetrics = () => {
    metricsAPI.incrementCounter('manual_metric_test', { source: 'navbar_button' });
    metricsAPI.trackUserEvent('metric_test_button', 'probar_metricas');
  };
  
  return (
    <Navbar expand="lg" className="bg-dark" variant="dark">
      <Container>
        <Navbar.Brand 
          as={Link} 
          to="/" 
          onClick={() => handleNavItemClick('home')}
        >
          Sistema San Cristóbal
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <NavDropdown 
              title="Clientes" 
              id="reportes-dropdown"
              onClick={() => handleNavItemClick('clientes_dropdown')}
            >
              <NavDropdown.Item 
                as={Link} 
                to="/clientes/nuevo"
                onClick={() => handleNavItemClick('clientes_nuevo')}
              >
                Nuevo Cliente
              </NavDropdown.Item>
              <NavDropdown.Item 
                as={Link} 
                to="/clientes/modificar"
                onClick={() => handleNavItemClick('clientes_modificar')}
              >
                Modificar Cliente
              </NavDropdown.Item>
            </NavDropdown>

            {/* Resto de los elementos del navbar similar... */}
            
            <Nav.Link 
              as={Link} 
              to="/creditos"
              onClick={() => handleNavItemClick('creditos')}
            >
              Créditos
            </Nav.Link>

            <Nav.Link 
              as={Link} 
              to="/movimientos"
              onClick={() => handleNavItemClick('movimientos')}
            >
              Movimientos
            </Nav.Link>
          </Nav>
          
          <button 
            className="btn btn-sm btn-warning ml-auto" 
            onClick={handleTestMetrics}
            style={{ marginLeft: '10px' }}
          >
            Probar Métricas
          </button>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavbarComponent;