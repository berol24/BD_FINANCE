import express from 'express';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import routes from './routes/index.js';
import { swaggerSpec } from './config/swagger.js';
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
// CORS middleware FIRST
app.use((req, res, next) => {
    const corsOrigin = process.env.CORS_ORIGIN;
    const allowedOrigins = [
        'http://localhost:4200',
        'http://localhost:3000',
        'https://bd-finance.pages.dev',
        'https://bd-finance-frontend.onrender.com',
        ...(corsOrigin ? [corsOrigin] : []),
    ];
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    }
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