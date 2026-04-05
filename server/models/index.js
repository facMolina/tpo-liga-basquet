const Liga = require('./Liga');
const Usuario = require('./Usuario');
const Equipo = require('./Equipo');
const Jugador = require('./Jugador');
const Partido = require('./Partido');

// --- Relaciones ---

// Equipo 1:N Jugador (ON DELETE SET NULL)
Equipo.hasMany(Jugador, { foreignKey: 'idEquipo', onDelete: 'SET NULL' });
Jugador.belongsTo(Equipo, { foreignKey: 'idEquipo' });

// Equipo 1:N Partido como Local
Equipo.hasMany(Partido, { foreignKey: 'idLocal', as: 'partidosLocal' });
Partido.belongsTo(Equipo, { foreignKey: 'idLocal', as: 'equipoLocal' });

// Equipo 1:N Partido como Visitante
Equipo.hasMany(Partido, { foreignKey: 'idVisitante', as: 'partidosVisitante' });
Partido.belongsTo(Equipo, { foreignKey: 'idVisitante', as: 'equipoVisitante' });

module.exports = {
  Liga,
  Usuario,
  Equipo,
  Jugador,
  Partido,
};
