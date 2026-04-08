const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticateJWT = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', authController.login);

// GET /api/auth/me — Ruta protegida: verifica token y retorna datos del usuario
router.get('/me', authenticateJWT, (req, res) => {
  res.json({ message: 'Token válido', usuario: req.user });
});

module.exports = router;
