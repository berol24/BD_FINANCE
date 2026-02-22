import express from 'express';
import dotenv from 'dotenv';
import routes from './routes/index.js';
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
// CORS middleware FIRST
app.use((req, res, next) => {
    const allowedOrigins = [
        'http://localhost:4200',
        'http://localhost:3000',
        'https://bd-finance.pages.dev',
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
app.use('/api', routes);
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
//# sourceMappingURL=app.js.map