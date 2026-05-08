const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticateJWT = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de login. Intentá de nuevo en 15 minutos.' },
});

router.post('/login', loginLimiter, authController.login);

router.get('/me', authenticateJWT, (req, res) => {
  res.json({ message: 'Token válido', usuario: req.user });
});

module.exports = router;
