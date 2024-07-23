import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

const authenticateToken = (req, res, next) => {
  const token = req.cookies.AuthCookie; 

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error('JWT Verification Error:', err);
      return res.status(403).json({ error: 'Unauthorized: Invalid token' });
    }
    req.user = decoded; 
    next(); 
  });
};

export default authenticateToken
