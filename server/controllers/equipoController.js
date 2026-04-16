const { z } = require('zod');
const { Op } = require('sequelize');
const { Equipo, Jugador, Partido } = require('../models');

const equipoCreateSchema = z.object({
  nombre: z.string().min(1, { message: 'El nombre es requerido' }).max(255),
  entrenador: z.string().min(1, { message: 'El entrenador es requerido' }).max(255),
}).strict();

const equipoUpdateSchema = z.object({
  nombre: z.string().min(1, { message: 'El nombre es requerido' }).max(255).optional(),
  entrenador: z.string().min(1, { message: 'El entrenador es requerido' }).max(255).optional(),
}).strict();

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
    const existe = await Equipo.findOne({ where: { nombre: validation.data.nombre } });
    if (existe) {
      return res.status(409).json({ error: 'Ya existe un equipo con ese nombre' });
    }
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

  if (Object.keys(validation.data).length === 0) {
    return res.status(400).json({ error: 'Debe proporcionar al menos un campo para actualizar' });
  }

  try {
    const equipo = await Equipo.findByPk(req.params.id);
    if (!equipo) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }
    if (validation.data.nombre) {
      const duplicado = await Equipo.findOne({
        where: { nombre: validation.data.nombre, idEquipo: { [Op.ne]: equipo.idEquipo } },
      });
      if (duplicado) {
        return res.status(409).json({ error: 'Ya existe un equipo con ese nombre' });
      }
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
    const t = await Equipo.sequelize.transaction();
    try {
      await Jugador.update({ idEquipo: null }, { where: { idEquipo: req.params.id }, transaction: t });
      await equipo.destroy({ transaction: t });
      await t.commit();
    } catch (txError) {
      await t.rollback();
      throw txError;
    }
    res.json({ message: 'Equipo eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar equipo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = { getAll, getById, create, update, destroy };
