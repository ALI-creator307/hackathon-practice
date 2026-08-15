// middleware/auth.js
// Har protected route pe yeh middleware chalta hai.
// Header se "Authorization: Bearer <token>" nikalta hai, verify karta hai,
// aur req.userId set kar deta hai taake age wale routes use kar sakein.

const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'quietbreak-hackathon-secret'; // demo ke liye hardcoded, production me .env se lena

function authMiddleware(req, res, next) {
    const header = req.headers['authorization'];

    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const token = header.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        next(); // sab theek hai, agle route handler pe chalo
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

module.exports = { authMiddleware, JWT_SECRET };