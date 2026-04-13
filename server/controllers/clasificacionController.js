const { Equipo } = require('../models');

const getClasificacion = async (req, res) => {
  try {
    const equipos = await Equipo.findAll({
      attributes: [
        'idEquipo',
        'nombre',
        'partidosGanados',
        'partidosEmpatados',
        'partidosPerdidos',
        'puntosFavor',
        'puntosEnContra',
      ],
    });

    const tabla = equipos.map((equipo) => {
      const e = equipo.toJSON();
      const puntos = e.partidosGanados * 3 + e.partidosEmpatados;
      const PJ = e.partidosGanados + e.partidosEmpatados + e.partidosPerdidos;
      const diferencia = e.puntosFavor - e.puntosEnContra;

      return {
        idEquipo: e.idEquipo,
        nombre: e.nombre,
        puntos,
        PJ,
        PG: e.partidosGanados,
        PE: e.partidosEmpatados,
        PP: e.partidosPerdidos,
        tantosFavor: e.puntosFavor,
        tantosEnContra: e.puntosEnContra,
        diferencia,
      };
    });

    tabla.sort((a, b) => {
      if (b.puntos !== a.puntos) return b.puntos - a.puntos;
      if (b.diferencia !== a.diferencia) return b.diferencia - a.diferencia;
      return b.tantosFavor - a.tantosFavor;
    });

    tabla.forEach((row, index) => {
      row.posicion = index + 1;
    });

    res.json(tabla);
  } catch (error) {
    console.error('Error al obtener clasificación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = { getClasificacion };
