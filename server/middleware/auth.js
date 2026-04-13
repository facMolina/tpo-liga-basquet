const jwt = require('jsonwebtoken');

const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Autenticación requerida' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Formato de autorización inválido. Use Bearer <token>' });
  }

  const token = parts[1];

  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET no está configurado');
    return res.status(500).json({ error: 'Error de configuración del servidor' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido o expirado' });
    }

    req.user = user;
    next();
  });
};

module.exports = authenticateJWT;
