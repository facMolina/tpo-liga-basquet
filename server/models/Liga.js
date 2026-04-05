const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Liga = sequelize.define('Liga', {
  idLiga: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  temporada: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'ligas',
  timestamps: true,
});

module.exports = Liga;
