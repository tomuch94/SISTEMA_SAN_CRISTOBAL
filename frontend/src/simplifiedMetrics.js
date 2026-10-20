// src/simplifiedMetrics.js
// Una implementación de métricas simplificada que no requiere módulos de Node.js

// Función de sanitización de nombres de métricas
const sanitizeMetricName = (name) => {
  // Reglas estrictas para nombres de métricas Prometheus
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')  // Reemplazar caracteres no válidos
    .replace(/^[^a-z_]/, '_')     // Asegurar que comience con letra o guión
    .replace(/__+/g, '_')         // Eliminar múltiples guiones
    .slice(0, 64);                // Limitar longitud
};

// Almacén para métricas
const metrics = {
  counters: {},
  histograms: {},
  lastSent: Date.now()
};

// Contador simple
export const incrementCounter = (name, labels = {}) => {
  try {
    // Sanitizar nombre de la métrica
    const sanitizedName = sanitizeMetricName(name);
    
    // Sanitizar etiquetas
    const sanitizedLabels = Object.fromEntries(
      Object.entries(labels).map(([k, v]) => [
        sanitizeMetricName(k), 
        typeof v === 'string' ? v.slice(0, 64) : v
      ])
    );

    const key = `${sanitizedName}:${JSON.stringify(sanitizedLabels)}`;
    metrics.counters[key] = (metrics.counters[key] || 0) + 1;
    return metrics.counters[key];
  } catch (error) {
    console.error(`Error al incrementar contador: ${name}`, error);
    return 0;
  }
};

// Histograma simplificado
export const recordDuration = (name, value, labels = {}) => {
  try {
    // Sanitizar nombre de la métrica
    const sanitizedName = sanitizeMetricName(name);
    
    // Sanitizar etiquetas
    const sanitizedLabels = Object.fromEntries(
      Object.entries(labels).map(([k, v]) => [
        sanitizeMetricName(k), 
        typeof v === 'string' ? v.slice(0, 64) : v
      ])
    );

    const key = `${sanitizedName}:${JSON.stringify(sanitizedLabels)}`;
    
    if (!metrics.histograms[key]) {
      metrics.histograms[key] = [];
    }
    
    // Validar que el valor sea un número
    const numericValue = Number(value);
    if (isNaN(numericValue)) {
      console.warn(`Valor no numérico ignorado: ${value}`);
      return;
    }
    
    metrics.histograms[key].push(numericValue);
    
    // Limitar el tamaño del arreglo para evitar problemas de memoria
    if (metrics.histograms[key].length > 1000) {
      metrics.histograms[key].shift();
    }
  } catch (error) {
    console.error(`Error al registrar duración: ${name}`, error);
  }
};

// API para registrar vistas de página
export const trackPageView = (page) => {
  return incrementCounter('page_views_total', { page });
};

// API para medir tiempo de carga de página
export const trackPageLoad = (page, loadTimeMs) => {
  recordDuration('page_load_time_ms', loadTimeMs, { page });
};

// API para registrar peticiones HTTP
export const trackHttpRequest = (method, endpoint, status, durationMs) => {
  incrementCounter('http_requests_total', { method, endpoint, status });
  recordDuration('http_request_duration_ms', durationMs, { method, endpoint, status });
};

// API para rastrear eventos de usuario
export const trackUserEvent = (eventType, element, value = null) => {
  incrementCounter('user_events_total', { eventType, element });
  if (value !== null) {
    recordDuration('user_interaction_duration_ms', value, { eventType, element });
  }
};

// Envía métricas al backend cada 15 segundos
export const setupMetricsReporting = (endpoint = 'http://metrics-server:9091/collect-metrics') => {
  // Verificar si metricsText es una cadena no vacía
  console.log('🔍 Configurando reporte de métricas en:', endpoint);
  const initialMetricsText = formatMetricsForPrometheus();
  console.log("Métricas formateadas (inicial):", initialMetricsText);
  
  if (!initialMetricsText || initialMetricsText.length === 0) {
    console.warn("No hay métricas para enviar, el texto está vacío");
    return;
  }

  // Asegurarse de no configurar múltiples intervalos
  if (window._metricsInterval) {
    clearInterval(window._metricsInterval);
  }
  
  console.log("Iniciando sistema de métricas, enviando a:", endpoint);
  
  window._metricsInterval = setInterval(() => {
    console.log("Métricas disponibles:", {
      counters: Object.keys(metrics.counters).length,
      histograms: Object.keys(metrics.histograms).length
    });
    
    // Verificar si hay métricas nuevas
    if (Object.keys(metrics.counters).length === 0 && Object.keys(metrics.histograms).length === 0) {
      console.log("No hay métricas nuevas para enviar");
      return;
    }
    
    try {
      // Convertir métricas a formato compatible con Prometheus
      const metricsText = formatMetricsForPrometheus();
      
      // Registro detallado de métricas
      console.group("Envío de Métricas");
      console.log("Métricas formateadas, tamaño:", metricsText.length);
      console.log("Fragmento de métricas:", metricsText.slice(0, 500) + "...");
      console.groupEnd();
      
      // Enviar métricas al servidor
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: metricsText,
        mode: 'cors',
        _skipMetrics: true // Evitar recursión
      })
      .then(response => {
        if (response.ok) {
          console.log("Métricas enviadas con éxito al servidor");
        } else {
          console.error("Error al enviar métricas, estado:", response.status);
        }
        return response.text();
      })
      .then(text => console.log("Respuesta del servidor:", text))
      .catch(err => {
        console.error('Error al enviar métricas:', err);
        // Intentar reenvío después de un tiempo
        setTimeout(() => {
          console.log("Reintentando envío de métricas...");
          setupMetricsReporting(endpoint);
        }, 30000); // Reintentar después de 30 segundos
      });
      
      // Registrar timestamp
      metrics.lastSent = Date.now();
    } catch (error) {
      console.error('Error al formatear o enviar métricas:', error);
    }
  }, 15000);
  
  // Limpiar intervalo cuando la ventana se cierra
  window.addEventListener('beforeunload', () => {
    if (window._metricsInterval) {
      clearInterval(window._metricsInterval);
    }
  });
  
  return () => {
    if (window._metricsInterval) {
      clearInterval(window._metricsInterval);
    }
  };
};

// Formatea las métricas para compatibilidad con Prometheus
const formatMetricsForPrometheus = () => {
  let output = '';

    // Logging para depuración
    console.log('🔍 Contadores:', metrics.counters);
    console.log('📊 Histogramas:', metrics.histograms);
  
  // Formatear contadores
  const processedMetricTypes = new Set();
  
  for (const [key, value] of Object.entries(metrics.counters)) {
    try {
      const parts = key.split(':', 2);
      const name = parts[0];
      const labelsJson = parts.length > 1 ? parts[1] : "{}";
      
      const labels = JSON.parse(labelsJson);
      
      if (!processedMetricTypes.has(name)) {
        output += `# HELP ${name} Counter metric for tracking occurrences\n`;
        output += `# TYPE ${name} counter\n`;
        processedMetricTypes.add(name);
      }
      
      const labelStr = Object.entries(labels)
        .map(([k, v]) => `${k}="${String(v).replace(/"/g, '\\"')}"`)
        .join(',');
      
      output += `${name}{${labelStr}} ${value}\n`;
    } catch (error) {
      console.error(`Error procesando métrica de contador: ${key}`, error);
    }
  }
  
  // Formatear histogramas
  for (const [key, values] of Object.entries(metrics.histograms)) {
    try {
      const parts = key.split(':', 2);
      const name = parts[0];
      const labelsJson = parts.length > 1 ? parts[1] : "{}";
      
      const labels = JSON.parse(labelsJson);
      
      if (!processedMetricTypes.has(name)) {
        output += `# HELP ${name} Histogram metric for tracking durations\n`;
        output += `# TYPE ${name} histogram\n`;
        processedMetricTypes.add(name);
      }
      
      const labelStr = Object.entries(labels)
        .map(([k, v]) => `${k}="${String(v).replace(/"/g, '\\"')}"`)
        .join(',');
      
      if (values.length > 0) {
        const sum = values.reduce((a, b) => a + b, 0);
        const count = values.length;
        
        output += `${name}_sum{${labelStr}} ${sum}\n`;
        output += `${name}_count{${labelStr}} ${count}\n`;
        
        // Percentiles aproximados
        values.sort((a, b) => a - b);
        const p50 = values[Math.floor(count * 0.5)];
        const p90 = values[Math.floor(count * 0.9)];
        const p99 = values[Math.floor(count * 0.99)] || values[values.length - 1];
        
        output += `${name}{${labelStr},quantile="0.5"} ${p50}\n`;
        output += `${name}{${labelStr},quantile="0.9"} ${p90}\n`;
        output += `${name}{${labelStr},quantile="0.99"} ${p99}\n`;
      }
    } catch (error) {
      console.error(`Error procesando métrica de histograma: ${key}`, error);
    }
  }
  
  return output;
};

// Función auxiliar para limpiar todas las métricas (útil para testing)
export const clearMetrics = () => {
  metrics.counters = {};
  metrics.histograms = {};
};

const metricsAPI = {
  incrementCounter,
  recordDuration,
  trackPageView,
  trackPageLoad,
  trackHttpRequest,
  trackUserEvent,
  setupMetricsReporting,
  clearMetrics
};

// Exportar API de métricas
export default metricsAPI;