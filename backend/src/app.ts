import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import YAML from 'yamljs';
import path from 'path';

const app: Application = express();
import routes from './routes';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(morgan('dev'));

// Helmet - disable CSP so Swagger UI CDN assets can load
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Load Swagger spec
const swaggerFilePath = path.resolve(process.cwd(), 'swagger.yaml');
let swaggerDocument: object;
try {
  swaggerDocument = YAML.load(swaggerFilePath);
  console.log('Swagger YAML loaded successfully');
} catch (err: any) {
  console.error('Failed to load swagger.yaml:', err.message);
  swaggerDocument = { openapi: '3.0.0', info: { title: 'Smart LMS API', version: '1.0.0' }, paths: {} };
}

// Serve swagger spec as JSON
app.get('/api-docs/swagger.json', (req: Request, res: Response) => {
  res.json(swaggerDocument);
});

// Serve Swagger UI from CDN (avoids Express 5 middleware issues)
app.get('/api-docs', (req: Request, res: Response) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Smart LMS API Documentation</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
  <style>
    html { box-sizing: border-box; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin: 0; background: #fafafa; }
    .topbar { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      SwaggerUIBundle({
        url: "/api-docs/swagger.json",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
        plugins: [SwaggerUIBundle.plugins.DownloadUrl],
        layout: "StandaloneLayout"
      });
    };
  </script>
</body>
</html>`;
  res.type('html').send(html);
});

// Redirect root to Swagger
app.get('/', (req: Request, res: Response) => {
  res.redirect('/api-docs');
});

// API Routes
app.use('/api', routes);

// Health Check Route
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'success', message: 'Smart LMS API is running' });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: err.message || 'Internal Server Error'
  });
});

export default app;

