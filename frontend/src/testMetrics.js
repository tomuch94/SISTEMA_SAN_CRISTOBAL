// src/testMetrics.js

export function sendTestMetric() {
    const metric = `# HELP test_metric A test metric from frontend
  # TYPE test_metric counter
  test_metric{source="manual_test"} 1
  `;
  
    console.log("Enviando métrica de prueba:", metric);
  
    // Intenta ambas URLs para ver cuál funciona
    tryFetch('http://localhost:9091/collect-metrics', metric)
      .then(() => tryFetch('/collect-metrics', metric))
      .then(() => tryFetch('http://metrics-server:9091/collect-metrics', metric));
  }
  
  function tryFetch(url, data) {
    console.log(`Intentando enviar a ${url}...`);
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: data,
      mode: 'cors'
    })
    .then(response => {
      console.log(`Respuesta de ${url}:`, response.status);
      return response.text();
    })
    .then(text => {
      console.log(`Contenido de respuesta de ${url}:`, text);
    })
    .catch(error => {
      console.error(`Error enviando a ${url}:`, error);
    });
  }