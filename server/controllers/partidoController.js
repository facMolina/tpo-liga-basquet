const { z } = require('zod');
const sequelize = require('../config/database');
const { Partido, Equipo } = require('../models');

const partidoCreateSchema = z.object({
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Formato de fecha inválido (YYYY-MM-DD)' }),
  hora: z.string().regex(/^\d{2}:\d{2}$/, { message: 'Formato de hora inválido (HH:MM)' }),
  lugar: z.string().min(1, { message: 'El lugar es requerido' }).max(255),
  idLocal: z.number().int().positive({ message: 'idLocal debe ser un entero positivo' }),
  idVisitante: z.number().int().positive({ message: 'idVisitante debe ser un entero positivo' }),
}).strict();

const partidoUpdateSchema = z.object({
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Formato de fecha inválido (YYYY-MM-DD)' }).optional(),
  hora: z.string().regex(/^\d{2}:\d{2}$/, { message: 'Formato de hora inválido (HH:MM)' }).optional(),
  lugar: z.string().min(1, { message: 'El lugar es requerido' }).max(255).optional(),
  idLocal: z.number().int().positive({ message: 'idLocal debe ser un entero positivo' }).optional(),
  idVisitante: z.number().int().positive({ message: 'idVisitante debe ser un entero positivo' }).optional(),
}).strict();

const resultadoSchema = z.object({
  puntosLocal: z.number().int().min(0, { message: 'puntosLocal debe ser >= 0' }).max(999),
  puntosVisitante: z.number().int().min(0, { message: 'puntosVisitante debe ser >= 0' }).max(999),
}).strict();

const include = [
  { model: Equipo, as: 'equipoLocal', attributes: ['idEquipo', 'nombre'] },
  { model: Equipo, as: 'equipoVisitante', attributes: ['idEquipo', 'nombre'] },
];

const getAll = async (req, res) => {
  try {
    const partidos = await Partido.findAll({ include });
    res.json(partidos);
  } catch (error) {
    console.error('Error al obtener partidos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const getById = async (req, res) => {
  try {
    const partido = await Partido.findByPk(req.params.id, { include });
    if (!partido) {
      return res.status(404).json({ error: 'Partido no encontrado' });
    }
    res.json(partido);
  } catch (error) {
    console.error('Error al obtener partido:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const create = async (req, res) => {
  const validation = partidoCreateSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ errors: validation.error.errors });
  }

  const { idLocal, idVisitante } = validation.data;

  if (idLocal === idVisitante) {
    return res.status(400).json({ error: 'Un equipo no puede jugar contra sí mismo' });
  }

  try {
    const [equipoLocal, equipoVisitante] = await Promise.all([
      Equipo.findByPk(idLocal),
      Equipo.findByPk(idVisitante),
    ]);

    if (!equipoLocal) {
      return res.status(400).json({ error: 'El equipo local especificado no existe' });
    }
    if (!equipoVisitante) {
      return res.status(400).json({ error: 'El equipo visitante especificado no existe' });
    }

    const partido = await Partido.create(validation.data);
    const partidoConEquipos = await Partido.findByPk(partido.idPartido, { include });
    res.status(201).json(partidoConEquipos);
  } catch (error) {
    console.error('Error al crear partido:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const update = async (req, res) => {
  const validation = partidoUpdateSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ errors: validation.error.errors });
  }

  if (Object.keys(validation.data).length === 0) {
    return res.status(400).json({ error: 'Debe proporcionar al menos un campo para actualizar' });
  }

  try {
    const partido = await Partido.findByPk(req.params.id);
    if (!partido) {
      return res.status(404).json({ error: 'Partido no encontrado' });
    }

    if (partido.puntosLocal !== null) {
      return res.status(400).json({ error: 'No se puede modificar un partido con resultado cargado' });
    }

    const { idLocal, idVisitante } = validation.data;
    const nuevoLocal = idLocal ?? partido.idLocal;
    const nuevoVisitante = idVisitante ?? partido.idVisitante;

    if (nuevoLocal === nuevoVisitante) {
      return res.status(400).json({ error: 'Un equipo no puede jugar contra sí mismo' });
    }

    if (idLocal) {
      const equipoLocal = await Equipo.findByPk(idLocal);
      if (!equipoLocal) {
        return res.status(400).json({ error: 'El equipo local especificado no existe' });
      }
    }
    if (idVisitante) {
      const equipoVisitante = await Equipo.findByPk(idVisitante);
      if (!equipoVisitante) {
        return res.status(400).json({ error: 'El equipo visitante especificado no existe' });
      }
    }

    await partido.update(validation.data);
    const partidoActualizado = await Partido.findByPk(partido.idPartido, { include });
    res.json(partidoActualizado);
  } catch (error) {
    console.error('Error al actualizar partido:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const destroy = async (req, res) => {
  try {
    const partido = await Partido.findByPk(req.params.id);
    if (!partido) {
      return res.status(404).json({ error: 'Partido no encontrado' });
    }

    if (partido.puntosLocal !== null) {
      return res.status(400).json({ error: 'No se puede eliminar un partido con resultado cargado' });
    }

    await partido.destroy();
    res.json({ message: 'Partido eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar partido:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const cargarResultado = async (req, res) => {
  const validation = resultadoSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ errors: validation.error.errors });
  }

  const { puntosLocal, puntosVisitante } = validation.data;
  const t = await sequelize.transaction();

  try {
    const partido = await Partido.findByPk(req.params.id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!partido) {
      await t.rollback();
      return res.status(404).json({ error: 'Partido no encontrado' });
    }

    if (partido.puntosLocal !== null) {
      await t.rollback();
      return res.status(400).json({ error: 'El resultado de este partido ya fue cargado' });
    }

    await partido.update({ puntosLocal, puntosVisitante }, { transaction: t });

    const equipoLocal = await Equipo.findByPk(partido.idLocal, { transaction: t, lock: t.LOCK.UPDATE });
    const equipoVisitante = await Equipo.findByPk(partido.idVisitante, { transaction: t, lock: t.LOCK.UPDATE });

    let localPG = 0, localPE = 0, localPP = 0;
    let visitantePG = 0, visitantePE = 0, visitantePP = 0;

    if (puntosLocal > puntosVisitante) {
      localPG = 1;
      visitantePP = 1;
    } else if (puntosLocal < puntosVisitante) {
      localPP = 1;
      visitantePG = 1;
    } else {
      localPE = 1;
      visitantePE = 1;
    }

    await equipoLocal.update({
      partidosGanados: equipoLocal.partidosGanados + localPG,
      partidosEmpatados: equipoLocal.partidosEmpatados + localPE,
      partidosPerdidos: equipoLocal.partidosPerdidos + localPP,
      puntosFavor: equipoLocal.puntosFavor + puntosLocal,
      puntosEnContra: equipoLocal.puntosEnContra + puntosVisitante,
    }, { transaction: t });

    await equipoVisitante.update({
      partidosGanados: equipoVisitante.partidosGanados + visitantePG,
      partidosEmpatados: equipoVisitante.partidosEmpatados + visitantePE,
      partidosPerdidos: equipoVisitante.partidosPerdidos + visitantePP,
      puntosFavor: equipoVisitante.puntosFavor + puntosVisitante,
      puntosEnContra: equipoVisitante.puntosEnContra + puntosLocal,
    }, { transaction: t });

    await t.commit();

    const partidoFinal = await Partido.findByPk(partido.idPartido, {
      include: [
        {
          model: Equipo,
          as: 'equipoLocal',
          attributes: ['idEquipo', 'nombre', 'partidosGanados', 'partidosEmpatados', 'partidosPerdidos', 'puntosFavor', 'puntosEnContra'],
        },
        {
          model: Equipo,
          as: 'equipoVisitante',
          attributes: ['idEquipo', 'nombre', 'partidosGanados', 'partidosEmpatados', 'partidosPerdidos', 'puntosFavor', 'puntosEnContra'],
        },
      ],
    });

    res.json(partidoFinal);
  } catch (error) {
    await t.rollback();
    console.error('Error al cargar resultado:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = { getAll, getById, create, update, destroy, cargarResultado };
