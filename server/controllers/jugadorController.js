const { z } = require('zod');
const { Jugador, Equipo } = require('../models');

const jugadorCreateSchema = z.object({
  nombre: z.string().min(1, { message: 'El nombre es requerido' }).max(255),
  apellido: z.string().min(1, { message: 'El apellido es requerido' }).max(255),
  categoria: z.string().min(1, { message: 'La categoría es requerida' }).max(100),
  idEquipo: z.number().int().positive().nullable().optional(),
}).strict();

const jugadorUpdateSchema = z.object({
  nombre: z.string().min(1, { message: 'El nombre es requerido' }).max(255).optional(),
  apellido: z.string().min(1, { message: 'El apellido es requerido' }).max(255).optional(),
  categoria: z.string().min(1, { message: 'La categoría es requerida' }).max(100).optional(),
  idEquipo: z.number().int().positive().nullable().optional(),
}).strict();

const getAll = async (req, res) => {
  try {
    const jugadores = await Jugador.findAll({
      include: [{ model: Equipo, attributes: ['idEquipo', 'nombre'] }],
    });
    res.json(jugadores);
  } catch (error) {
    console.error('Error al obtener jugadores:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const getById = async (req, res) => {
  try {
    const jugador = await Jugador.findByPk(req.params.id, {
      include: [{ model: Equipo, attributes: ['idEquipo', 'nombre'] }],
    });
    if (!jugador) {
      return res.status(404).json({ error: 'Jugador no encontrado' });
    }
    res.json(jugador);
  } catch (error) {
    console.error('Error al obtener jugador:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const create = async (req, res) => {
  const validation = jugadorCreateSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ errors: validation.error.errors });
  }

  const { idEquipo } = validation.data;

  try {
    if (idEquipo != null) {
      const equipo = await Equipo.findByPk(idEquipo);
      if (!equipo) {
        return res.status(400).json({ error: 'El equipo especificado no existe' });
      }
    }

    const jugador = await Jugador.create(validation.data);
    res.status(201).json(jugador);
  } catch (error) {
    console.error('Error al crear jugador:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const update = async (req, res) => {
  const validation = jugadorUpdateSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ errors: validation.error.errors });
  }

  try {
    const jugador = await Jugador.findByPk(req.params.id);
    if (!jugador) {
      return res.status(404).json({ error: 'Jugador no encontrado' });
    }

    const { idEquipo } = validation.data;
    if (idEquipo != null) {
      const equipo = await Equipo.findByPk(idEquipo);
      if (!equipo) {
        return res.status(400).json({ error: 'El equipo especificado no existe' });
      }
    }

    await jugador.update(validation.data);
    res.json(jugador);
  } catch (error) {
    console.error('Error al actualizar jugador:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const destroy = async (req, res) => {
  try {
    const jugador = await Jugador.findByPk(req.params.id);
    if (!jugador) {
      return res.status(404).json({ error: 'Jugador no encontrado' });
    }
    await jugador.destroy();
    res.json({ message: 'Jugador eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar jugador:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = { getAll, getById, create, update, destroy };
