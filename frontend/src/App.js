import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Clientes from "./modules/Clientes/Clientes";
import ModificarCliente from "./modules/Clientes/Modificar_Cliente";

import { NuevoProducto } from './modules/Productos/Productos';
import { EditarProducto } from './modules/Productos/EditarProducto';
// import { Prefacturas } from './modules/Prefacturas';
import { NuevaPrefactura } from './modules/Prefacturas/NuevaPrefactura';
import { Creditos } from './modules/Creditos';
import { Movimientos } from "./modules/Movimientos";
import { InsertarUnidadMedida } from "./modules/UnidadesMedida/UnidadesMedida";
import Navbar from "./components/Navbar";
import 'bootstrap/dist/css/bootstrap.min.css';

// Importamos las utilidades de métricas
import {
  trackPageView,
  trackPageLoad,
  setupMetricsReporting,
  trackHttpRequest,
  incrementCounter 
} from './simplifiedMetrics';
import metricsAPI from './simplifiedMetrics';
incrementCounter('test_metric2', { test: 'value' });
// Componente para rastrear navegación entre páginas
const PageTracker = () => {
  const location = useLocation();


    // Añadir track de página al renderizar
    useEffect(() => {
      // Registrar vista de página al cargar el componente
      metricsAPI.trackPageView('navbar');
    }, []);
  
  useEffect(() => {
    // Registrar vista de página cuando cambia la ruta
    trackPageView(location.pathname);
    
    // Medir tiempo de carga de la página
    const startTime = performance.now();
    
    // Función para medir cuando la página termina de cargar
    const measureLoadTime = () => {
      const loadTime = performance.now() - startTime;
      trackPageLoad(location.pathname, loadTime);
    };
    
    // Si el documento ya está cargado, medir inmediatamente
    if (document.readyState === 'complete') {
      measureLoadTime();
    } else {
      // De lo contrario, esperar al evento load
      window.addEventListener('load', measureLoadTime, { once: true });
    }
    
    console.log(`Navegación a: ${location.pathname}`);
    
    // Limpieza
    return () => {
      window.removeEventListener('load', measureLoadTime);
    };
  }, [location.pathname]);
  
  return null;
};

function App() {
  useEffect(() => {
    // Configurar envío automático de métricas
    console.log('Iniciando sistema de métricas...');
    setupMetricsReporting();
    console.log('Sistema de métricas iniciado');
    
    // Interceptar todas las llamadas a fetch para registrar métricas
    const originalFetch = window.fetch;
    window.fetch = function(url, options = {}) {
      // No monitorear las llamadas a la API de métricas (para evitar recursión)
      if (options._skipMetrics) {
        return originalFetch(url, options);
      }
      
      const method = options.method || 'GET';
      const startTime = performance.now();
      let endpoint;
      
      try {
        // Extraer el path de la URL
        endpoint = new URL(url, window.location.origin).pathname;
      } catch (e) {
        endpoint = url;
      }
      
      return originalFetch(url, options)
        .then(response => {
          // Medir tiempo al recibir la respuesta
          const duration = performance.now() - startTime;
          trackHttpRequest(method, endpoint, response.status, duration);
          return response;
        })
        .catch(error => {
          // Registrar errores
          const duration = performance.now() - startTime;
          trackHttpRequest(method, endpoint, 'error', duration);
          throw error;
        });
    };
    
    console.log('Sistema de métricas iniciado');
    
    // Limpieza al desmontar
    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return (
    <Router>
      <PageTracker />
      <Navbar />
      <Routes>
        <Route path="/clientes/nuevo" element={<Clientes />} />
        <Route path="/clientes/modificar" element={<ModificarCliente />} />
        <Route path="/productos/nuevo" element={<NuevoProducto />} />
        <Route path="/productos/modificar" element={<EditarProducto />} />
        {/* <Route path="/prefacturas" element={<Prefacturas />} /> */}
        <Route path="/prefacturas/nuevo" element={<NuevaPrefactura />} />
        <Route path="/creditos" element={<Creditos />} />
        <Route path="/movimientos" element={<Movimientos />} />
        <Route path="/unidades-medida" element={<InsertarUnidadMedida />} />
      </Routes>
    </Router>
  );
}

export default App;