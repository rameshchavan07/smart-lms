import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import logger from './utils/logger';
import YAML from 'yamljs';
import path from 'path';
import passport from 'passport';
import session from 'express-session';
import { configurePassport } from './services/passportService';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { doubleCsrfProtection, generateCsrfToken, invalidCsrfTokenError } from './middleware/csrf';

const allowedOrigins = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : ['http://localhost:5173'];

const app: Application = express();
import routes from './routes';

// Configure Passport strategy
configurePassport();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(pinoHttp({ logger, serializers: { req: (req) => ({ method: req.method, url: req.url }) } }));

// Serve static uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

const isProd = process.env.NODE_ENV === 'production';

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProd ? 200 : 10000, // Limit each IP to 200 requests per `window` in prod, 10000 in dev
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests from this IP, please try again later.' }
});
app.use('/api', apiLimiter);

// Strict limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 10 : 10000, // 10 in prod, 10000 in dev
  message: { message: 'Too many login attempts from this IP, please try again after 15 minutes' }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Session (required for Passport OAuth redirect flow)
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'open-learn-x-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production', maxAge: 5 * 60 * 1000 },
  })
);
app.use(passport.initialize());
app.use(passport.session());

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
} catch (err) {
  console.error('Failed to load swagger.yaml:', err instanceof Error ? err.message : String(err));
  swaggerDocument = { openapi: '3.0.0', info: { title: 'OpenLearnX API', version: '1.0.0' }, paths: {} };
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
  <title>OpenLearnX API Documentation</title>
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

// CSRF Token Route
app.get('/api/csrf-token', (req: Request, res: Response) => {
  const csrfToken = generateCsrfToken(req, res);
  res.json({ csrfToken });
});

// Apply CSRF Protection
app.use('/api', doubleCsrfProtection);

// API Routes
app.use('/api', routes);

// Health Check Route
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'success', message: 'OpenLearnX API is running' });
});

// 404 Handler for undefined API routes
app.use('/api', (req: Request, res: Response) => {
  res.status(404).json({ message: 'API route not found' });
});

import { globalErrorHandler } from './middleware/errorHandler';

// Global Error Handler
app.use(globalErrorHandler);

export default app;

