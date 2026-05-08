const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Jugador = sequelize.define('Jugador', {
  idJugador: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  apellido: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  categoria: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  idEquipo: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'equipos',
      key: 'idEquipo',
    },
  },
}, {
  tableName: 'jugadores',
  timestamps: true,
});

module.exports = Jugador;
