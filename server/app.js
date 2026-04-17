const express = require('express');
const cors = require('cors');
require('dotenv').config();

const sequelize = require('./config/database');
const models = require('./models');

const app = express();

// CORS
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim()).filter(Boolean)
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
}));

app.use(express.json());

// Rutas
const authRoutes = require('./routes/auth');
const ligaRoutes = require('./routes/liga');
const equipoRoutes = require('./routes/equipo');
const jugadorRoutes = require('./routes/jugador');
const partidoRoutes = require('./routes/partido');
const clasificacionRoutes = require('./routes/clasificacion');

app.use('/api/auth', authRoutes);
app.use('/api/ligas', ligaRoutes);
app.use('/api/equipos', equipoRoutes);
app.use('/api/jugadores', jugadorRoutes);
app.use('/api/partidos', partidoRoutes);
app.use('/api/clasificacion', clasificacionRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend funcionando correctamente' });
});

// Sincronizar DB y levantar servidor
const PORT = process.env.PORT || 3000;

sequelize
  .sync()
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
