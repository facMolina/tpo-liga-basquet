const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Equipo = sequelize.define('Equipo', {
  idEquipo: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  entrenador: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  partidosGanados: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  partidosEmpatados: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  partidosPerdidos: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  puntosFavor: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  puntosEnContra: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  tableName: 'equipos',
  timestamps: true,
});

module.exports = Equipo;
