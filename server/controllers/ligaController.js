const { z } = require('zod');
const { Liga } = require('../models');

const ligaUpdateSchema = z.object({
  nombre: z.string().min(1, { message: 'El nombre es requerido' }),
  temporada: z.string().min(1, { message: 'La temporada es requerida' }),
  descripcion: z.string().nullable().optional(),
});

const getAll = async (req, res) => {
  try {
    const ligas = await Liga.findAll();
    res.json(ligas);
  } catch (error) {
    console.error('Error al obtener ligas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const getById = async (req, res) => {
  try {
    const liga = await Liga.findByPk(req.params.id);
    if (!liga) {
      return res.status(404).json({ error: 'Liga no encontrada' });
    }
    res.json(liga);
  } catch (error) {
    console.error('Error al obtener liga:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const update = async (req, res) => {
  const validation = ligaUpdateSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ errors: validation.error.errors });
  }

  try {
    const liga = await Liga.findByPk(req.params.id);
    if (!liga) {
      return res.status(404).json({ error: 'Liga no encontrada' });
    }
    await liga.update(validation.data);
    res.json(liga);
  } catch (error) {
    console.error('Error al actualizar liga:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = { getAll, getById, update };
