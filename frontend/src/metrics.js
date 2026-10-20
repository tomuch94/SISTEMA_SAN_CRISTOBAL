// src/metrics.js
import { Registry, Counter, Histogram } from 'prom-client';

// Creamos un registro para nuestras métricas
const register = new Registry();

// Contador de navegaciones a páginas
export const componentRenderCounter = new Counter({
  name: 'page_views_total',
  help: 'Total number of page views',
  labelNames: ['component'],
  registers: [register]
});

// Histograma para medir el tiempo de carga de página
export const pageLoadHistogram = new Histogram({
  name: 'page_load_time_seconds',
  help: 'Time for page to load completely',
  labelNames: ['page'],
  buckets: [0.1, 0.5, 1, 2, 5],
  registers: [register]
});

// Contador para peticiones HTTP del cliente
export const httpRequestCounter = new Counter({
  name: 'http_requests_total',
  help: 'Count of HTTP requests made by the frontend',
  labelNames: ['method', 'endpoint', 'status'],
  registers: [register]
});

// Histograma para medir tiempos de respuesta
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'endpoint', 'status'],
  buckets: [0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register]
});

// Métricas para eventos de formularios
export const formEventCounter = new Counter({
  name: 'form_events_total',
  help: 'Count of form events (submissions, errors)',
  labelNames: ['form', 'action', 'status'],
  registers: [register]
});

// Métricas para tiempo de interacción con los formularios
export const formInteractionTime = new Histogram({
  name: 'form_interaction_time_seconds',
  help: 'Time spent interacting with forms',
  labelNames: ['form'],
  buckets: [1, 5, 10, 30, 60, 180],
  registers: [register]
});

// Función para iniciar la medición de carga de página
export const measurePageLoad = (pageName) => {
  const end = pageLoadHistogram.startTimer({ page: pageName });
  
  // Si la página ya está cargada, finalizamos el timer inmediatamente
  if (document.readyState === 'complete') {
    end();
    return;
  }
  
  // De lo contrario, esperamos a que cargue
  window.addEventListener('load', () => {
    end();
  }, { once: true });
};

// Función para medir el tiempo de interacción con un formulario
export const startFormTracking = (formName) => {
  const startTime = Date.now();
  return {
    finish: (status = 'success') => {
      const duration = (Date.now() - startTime) / 1000; // Convertir a segundos
      formInteractionTime.observe({ form: formName }, duration);
      formEventCounter.inc({ form: formName, action: 'submit', status });
    },
    cancel: () => {
      const duration = (Date.now() - startTime) / 1000;
      formInteractionTime.observe({ form: formName }, duration);
      formEventCounter.inc({ form: formName, action: 'cancel', status: 'cancelled' });
    },
    error: () => {
      const duration = (Date.now() - startTime) / 1000;
      formInteractionTime.observe({ form: formName }, duration);
      formEventCounter.inc({ form: formName, action: 'submit', status: 'error' });
    }
  };
};

// Función para enviar las métricas al endpoint /metrics
export const setupMetricsEndpoint = () => {
  // Endpoint donde enviaremos las métricas
  const metricsEndpoint = '/collect-metrics';
  
  // Enviar métricas cada 15 segundos
  setInterval(async () => {
    try {
      const metrics = await register.metrics();
      
      // Enviar las métricas al servidor
      fetch(metricsEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: metrics,
        // No queremos medir esta petición para evitar recursión
        _skipMetrics: true
      }).catch(err => console.error('Error sending metrics:', err));
    } catch (error) {
      console.error('Error generating metrics:', error);
    }
  }, 15000);
};

// Middleware para interceptar y medir peticiones fetch
export const measureHttpRequest = async (url, options = {}, originalFetch) => {
  // Si la petición está marcada para saltarse las métricas, no la medimos
  if (options._skipMetrics) {
    delete options._skipMetrics;
    return originalFetch(url, options);
  }
  
  const method = options.method || 'GET';
  const start = performance.now();
  
  try {
    // Realizar la petición
    const response = await originalFetch(url, options);
    const duration = (performance.now() - start) / 1000; // convertir a segundos
    
    // Extraer el path de la URL para las métricas
    let endpoint;
    try {
      endpoint = new URL(url, window.location.origin).pathname;
    } catch (e) {
      endpoint = url;
    }
    
    // Registrar métricas de éxito
    httpRequestCounter.inc({
      method,
      endpoint,
      status: response.status
    });
    
    httpRequestDuration.observe(
      {
        method,
        endpoint,
        status: response.status
      },
      duration
    );
    
    return response;
  } catch (error) {
    const duration = (performance.now() - start) / 1000;
    
    // Extraer el path para las métricas
    let endpoint;
    try {
      endpoint = new URL(url, window.location.origin).pathname;
    } catch (e) {
      endpoint = url;
    }
    
    // Registrar métricas de error
    httpRequestCounter.inc({
      method,
      endpoint,
      status: 'error'
    });
    
    httpRequestDuration.observe(
      {
        method,
        endpoint,
        status: 'error'
      },
      duration
    );
    
    throw error;
  }
};

// Exportamos el registro para uso avanzado
export default register;