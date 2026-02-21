import jwt from 'jsonwebtoken';
const getAccessSecret = () => {
    return process.env.JWT_ACCESS_SECRET ?? process.env.JWT_SECRET;
};
export const authenticateAccessToken = (req, res, next) => {
    const accessSecret = getAccessSecret();
    if (!accessSecret) {
        res.status(500).json({ message: 'Access token secret not configured' });
        return;
    }
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ message: 'Missing or invalid authorization header' });
        return;
    }
    const token = authHeader.slice('Bearer '.length);
    try {
        const payload = jwt.verify(token, accessSecret);
        req.userId = payload.userId?.toString();
        next();
    }
    catch (error) {
        res.status(401).json({ message: 'Invalid or expired access token' });
    }
};
//# sourceMappingURL=auth.js.map