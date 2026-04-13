const { z } = require('zod');
const { Op } = require('sequelize');
const { Equipo, Jugador, Partido } = require('../models');

const equipoCreateSchema = z.object({
  nombre: z.string().min(1, { message: 'El nombre es requerido' }),
  entrenador: z.string().min(1, { message: 'El entrenador es requerido' }),
});

const equipoUpdateSchema = z.object({
  nombre: z.string().min(1, { message: 'El nombre es requerido' }).optional(),
  entrenador: z.string().min(1, { message: 'El entrenador es requerido' }).optional(),
});

const getAll = async (req, res) => {
  try {
    const equipos = await Equipo.findAll();
    res.json(equipos);
  } catch (error) {
    console.error('Error al obtener equipos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const getById = async (req, res) => {
  try {
    const equipo = await Equipo.findByPk(req.params.id, {
      include: [
        { model: Jugador },
        {
          model: Partido,
          as: 'partidosLocal',
          include: [{ model: Equipo, as: 'equipoVisitante', attributes: ['idEquipo', 'nombre'] }],
        },
        {
          model: Partido,
          as: 'partidosVisitante',
          include: [{ model: Equipo, as: 'equipoLocal', attributes: ['idEquipo', 'nombre'] }],
        },
      ],
    });
    if (!equipo) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }
    res.json(equipo);
  } catch (error) {
    console.error('Error al obtener equipo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const create = async (req, res) => {
  const validation = equipoCreateSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ errors: validation.error.errors });
  }

  try {
    const equipo = await Equipo.create(validation.data);
    res.status(201).json(equipo);
  } catch (error) {
    console.error('Error al crear equipo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const update = async (req, res) => {
  const validation = equipoUpdateSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ errors: validation.error.errors });
  }

  try {
    const equipo = await Equipo.findByPk(req.params.id);
    if (!equipo) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }
    await equipo.update(validation.data);
    res.json(equipo);
  } catch (error) {
    console.error('Error al actualizar equipo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const destroy = async (req, res) => {
  try {
    const equipo = await Equipo.findByPk(req.params.id);
    if (!equipo) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }
    const totalPartidos = await Partido.count({
      where: { [Op.or]: [{ idLocal: req.params.id }, { idVisitante: req.params.id }] },
    });
    if (totalPartidos > 0) {
      return res.status(409).json({
        error: `No se puede eliminar el equipo: tiene ${totalPartidos} partido(s) asociado(s). Eliminá los partidos primero.`,
      });
    }
    await Jugador.update({ idEquipo: null }, { where: { idEquipo: req.params.id } });
    await equipo.destroy();
    res.json({ message: 'Equipo eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar equipo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = { getAll, getById, create, update, destroy };
