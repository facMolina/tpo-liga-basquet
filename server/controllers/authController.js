const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');

const login = async (req, res) => {
  const { usuario, password } = req.body;

  try {
    const user = await Usuario.findOne({ where: { usuario } });
    
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { idUsuario: user.idUsuario, usuario: user.usuario },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '12h' }
    );

    res.json({
      message: 'Login exitoso',
      token,
      usuario: {
        idUsuario: user.idUsuario,
        usuario: user.usuario
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = {
  login
};
