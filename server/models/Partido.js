const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Partido = sequelize.define('Partido', {
  idPartido: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  hora: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  lugar: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  puntosLocal: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  puntosVisitante: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  idLocal: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'equipos',
      key: 'idEquipo',
    },
  },
  idVisitante: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'equipos',
      key: 'idEquipo',
    },
  },
}, {
  tableName: 'partidos',
  timestamps: true,
});

module.exports = Partido;
