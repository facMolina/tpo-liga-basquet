const express = require('express');
const cors = require('cors');
require('dotenv').config();

const sequelize = require('./config/database');
const models = require('./models');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
const authRoutes = require('./routes/auth');
const ligaRoutes = require('./routes/liga');
const equipoRoutes = require('./routes/equipo');
const jugadorRoutes = require('./routes/jugador');

app.use('/api/auth', authRoutes);
app.use('/api/ligas', ligaRoutes);
app.use('/api/equipos', equipoRoutes);
app.use('/api/jugadores', jugadorRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend funcionando correctamente' });
});

// Sincronizar DB y levantar servidor
const PORT = process.env.PORT || 3000;

sequelize
  .sync({ alter: true })
  .then(() => {
    console.log('Base de datos sincronizada correctamente.');
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error al sincronizar la base de datos:', error);
  });

module.exports = app;
