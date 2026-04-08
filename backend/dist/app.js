import express from 'express';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import routes from './routes/index.js';
import { swaggerSpec } from './config/swagger.js';
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;
// CORS middleware FIRST
app.use((req, res, next) => {
    const corsOrigin = process.env.CORS_ORIGIN;
    const allowedOrigins = new Set([
        'http://localhost:4200',
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:4200',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        'https://bd-finance.pages.dev',
        'https://bd-finance-tbr7.onrender.com',
        ...(corsOrigin ? [corsOrigin] : []),
    ]);
    const origin = req.headers.origin;
    const isLocalOrigin = typeof origin === 'string' &&
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
    const isAllowedOrigin = typeof origin === 'string' && (allowedOrigins.has(origin) || isLocalOrigin);
    if (isAllowedOrigin) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    res.header('Vary', 'Origin');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});
// Parse JSON bodies
app.use(express.json());
// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'BD Finance API Documentation',
}));
// JSON spec endpoint
app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});
app.use('/api', routes);
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`📚 Swagger documentation available at http://localhost:${PORT}/api-docs`);
});
//# sourceMappingURL=app.js.map