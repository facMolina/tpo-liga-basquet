const { Equipo } = require('../models');

const getClasificacion = async (req, res) => {
  try {
    const equipos = await Equipo.findAll({
      attributes: [
        'idEquipo',
        'nombre',
        'puntos',
        'partidosJugados',
        'partidosGanados',
        'partidosEmpatados',
        'partidosPerdidos',
        'puntosFavor',
        'puntosEnContra',
        'diferencia',
      ],
      order: [
        ['puntos', 'DESC'],
        ['diferencia', 'DESC'],
        ['puntosFavor', 'DESC'],
      ],
    });

    const tabla = equipos.map((equipo, index) => {
      const e = equipo.toJSON();
      return {
        posicion: index + 1,
        idEquipo: e.idEquipo,
        nombre: e.nombre,
        puntos: e.puntos,
        PJ: e.partidosJugados,
        PG: e.partidosGanados,
        PE: e.partidosEmpatados,
        PP: e.partidosPerdidos,
        tantosFavor: e.puntosFavor,
        tantosEnContra: e.puntosEnContra,
        diferencia: e.diferencia,
      };
    });

    res.json(tabla);
  } catch (error) {
    console.error('Error al obtener clasificación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = { getClasificacion };
