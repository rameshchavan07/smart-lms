import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import YAML from 'yamljs';
import path from 'path';
import passport from 'passport';
import session from 'express-session';
import { configurePassport } from './services/passportService';
import rateLimit from 'express-rate-limit';

const allowedOrigins = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : ['http://localhost:5173'];

const app: Application = express();
import routes from './routes';

// Configure Passport strategy
configurePassport();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(morgan('dev'));

// Serve static uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per `window`
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

// Strict limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many login attempts from this IP, please try again after 15 minutes'
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
} catch (err: any) {
  console.error('Failed to load swagger.yaml:', err.message);
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

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: err.message || 'Internal Server Error'
  });
});

export default app;

