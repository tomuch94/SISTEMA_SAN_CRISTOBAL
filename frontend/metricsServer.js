// metricsServer.js
const express = require('express');
const cors = require('cors');
const { Registry, Counter, Gauge } = require('prom-client');

// Crear un registro global para métricas del servidor
const register = new Registry();

// Métricas del servidor
const httpRequestsTotal = new Counter({
  name: 'metrics_server_http_requests_total',
  help: 'Total HTTP requests to metrics server',
  labelNames: ['method', 'route', 'status'],
  registers: [register]
});

const connectedClients = new Gauge({
  name: 'metrics_server_connected_clients',
  help: 'Number of currently connected clients',
  registers: [register]
});

// Incrementar contador de clientes al inicio
connectedClients.inc();

// Crear el servidor express
const app = express();
app.use(cors({
  origin: '*', // En producción deberías limitar esto
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.text({ type: '*/*', limit: '10mb' }));

// Middleware para registrar peticiones
app.use((req, res, next) => {
  const start = Date.now();
  
  // Cuando la respuesta termine
  res.on('finish', () => {
    httpRequestsTotal.inc({
      method: req.method,
      route: req.path,
      status: res.statusCode
    });
  });
  
  next();
});

// Variable para almacenar las métricas del frontend
let metricsFromFrontend = '';

// Endpoint para recibir métricas del frontend
// En metricsServer.js
app.post('/collect-metrics', (req, res) => {
  try {
    console.log('Headers de solicitud:', JSON.stringify(req.headers));
    
    // Almacenar las métricas recibidas
    const body = req.body || '';
    console.log('Métricas recibidas, tamaño:', body.length);
    console.log('Contenido:', body);
    // Imprimir las métricas recibidas para depuración
    console.log('Contenido de las métricas recibidas:');
    console.log(req.body.substring(0, 500) + '...'); // Imprimir los primeros 500 caracteres
    
    // Almacenar las métricas recibidas
    metricsFromFrontend = req.body;
    console.log('Métricas recibidas del frontend, tamaño:', req.body.length, 'bytes');
    console.log('Primeras 100 caracteres:', req.body.substring(0, 100));
    res.status(200).send('Métricas recibidas correctamente');
  } catch (error) {
    console.error('Error procesando métricas:', error);
    res.status(500).send('Error procesando métricas');
  }
});

// Endpoint para exponer métricas en formato Prometheus
// app.get('/metrics', async (req, res) => {
//   try {
//     // Combinar métricas del servidor con las recibidas del frontend
//     const serverMetrics = await register.metrics();
//     const allMetrics = serverMetrics + '\n' + metricsFromFrontend;
    
//     res.set('Content-Type', register.contentType);
//     res.end(allMetrics);
//   } catch (error) {
//     console.error('Error generando métricas:', error);
//     res.status(500).send('Error generando métricas');
//   }
// });
app.get('/metrics', async (req, res) => {
  try {
    // Combinar métricas del servidor con las recibidas del frontend
    const serverMetrics = await register.metrics();
    
    console.log("Métricas del servidor:", serverMetrics.length, "bytes");
    console.log("Métricas del frontend:", metricsFromFrontend ? metricsFromFrontend.length : 0, "bytes");
    
    // Asegurarse de que metricsFromFrontend no es undefined o vacío
    const frontendMetricsText = metricsFromFrontend || '';
    
    // Combinar las métricas con un separador claro
    const allMetrics = serverMetrics + 
                       "\n# --- FRONTEND METRICS ---\n" + 
                       frontendMetricsText;
    
    res.set('Content-Type', register.contentType);
    res.end(allMetrics);
  } catch (error) {
    console.error('Error generando métricas:', error);
    res.status(500).send('Error generando métricas');
  }
});

// Ruta de prueba/estado
app.get('/health', (req, res) => {
  res.status(200).send('Metrics server is running');
});

// Iniciar el servidor
const PORT = process.env.METRICS_PORT || 9091;
app.listen(PORT, () => {
  console.log(`Servidor de métricas escuchando en puerto ${PORT}`);
});

// Manejo de cierre limpio
process.on('SIGTERM', () => {
  console.log('Cerrando servidor de métricas...');
  connectedClients.dec();
  process.exit(0);
});

module.exports = app;