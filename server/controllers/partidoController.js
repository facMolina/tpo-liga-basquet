const { z } = require('zod');
const sequelize = require('../config/database');
const { Partido, Equipo } = require('../models');

const fechaSchema = z
  .string()
  .regex(/^(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[012])\/\d{4}$/, {
    message: 'Formato de fecha inválido (DD/MM/AAAA)',
  })
  .refine(
    (s) => {
      const [d, m, y] = s.split('/').map(Number);
      const date = new Date(y, m - 1, d);
      return (
        date.getFullYear() === y &&
        date.getMonth() === m - 1 &&
        date.getDate() === d
      );
    },
    { message: 'Fecha inválida (no existe en el calendario)' }
  )
  .transform((s) => {
    const [d, m, y] = s.split('/');
    return `${y}-${m}-${d}`;
  });

const partidoCreateSchema = z.object({
  fecha: fechaSchema,
  hora: z.string().regex(/^\d{2}:\d{2}$/, { message: 'Formato de hora inválido (HH:MM)' }),
  lugar: z.string().min(1, { message: 'El lugar es requerido' }).max(255),
  idLocal: z.number().int().positive({ message: 'idLocal debe ser un entero positivo' }),
  idVisitante: z.number().int().positive({ message: 'idVisitante debe ser un entero positivo' }),
}).strict();

const partidoUpdateSchema = z.object({
  fecha: fechaSchema.optional(),
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
  let t;

  try {
    t = await sequelize.transaction();

    const partido = await Partido.findByPk(req.params.id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!partido) {
      await t.rollback();
      t = null;
      return res.status(404).json({ error: 'Partido no encontrado' });
    }

    const equipoLocal = await Equipo.findByPk(partido.idLocal, { transaction: t, lock: t.LOCK.UPDATE });
    const equipoVisitante = await Equipo.findByPk(partido.idVisitante, { transaction: t, lock: t.LOCK.UPDATE });

    let deltaLocalPJ = 1, deltaVisitantePJ = 1;

    if (partido.puntosLocal !== null) {
      // Revertir stats del resultado anterior
      deltaLocalPJ = 0;
      deltaVisitantePJ = 0;
      const oldLocalPG = partido.puntosLocal > partido.puntosVisitante ? 1 : 0;
      const oldLocalPE = partido.puntosLocal === partido.puntosVisitante ? 1 : 0;
      const oldLocalPP = partido.puntosLocal < partido.puntosVisitante ? 1 : 0;
      const oldVisitantePG = partido.puntosVisitante > partido.puntosLocal ? 1 : 0;
      const oldVisitantePE = oldLocalPE;
      const oldVisitantePP = partido.puntosVisitante < partido.puntosLocal ? 1 : 0;

      await equipoLocal.update({
        partidosGanados: equipoLocal.partidosGanados - oldLocalPG,
        partidosEmpatados: equipoLocal.partidosEmpatados - oldLocalPE,
        partidosPerdidos: equipoLocal.partidosPerdidos - oldLocalPP,
        puntosFavor: equipoLocal.puntosFavor - partido.puntosLocal,
        puntosEnContra: equipoLocal.puntosEnContra - partido.puntosVisitante,
        puntos: equipoLocal.puntos - (oldLocalPG * 3 + oldLocalPE),
        diferencia: equipoLocal.diferencia - (partido.puntosLocal - partido.puntosVisitante),
      }, { transaction: t });

      await equipoVisitante.update({
        partidosGanados: equipoVisitante.partidosGanados - oldVisitantePG,
        partidosEmpatados: equipoVisitante.partidosEmpatados - oldVisitantePE,
        partidosPerdidos: equipoVisitante.partidosPerdidos - oldVisitantePP,
        puntosFavor: equipoVisitante.puntosFavor - partido.puntosVisitante,
        puntosEnContra: equipoVisitante.puntosEnContra - partido.puntosLocal,
        puntos: equipoVisitante.puntos - (oldVisitantePG * 3 + oldVisitantePE),
        diferencia: equipoVisitante.diferencia - (partido.puntosVisitante - partido.puntosLocal),
      }, { transaction: t });

      // Recargar para tener valores actualizados
      await equipoLocal.reload({ transaction: t });
      await equipoVisitante.reload({ transaction: t });
    }

    await partido.update({ puntosLocal, puntosVisitante }, { transaction: t });

    let localPG = 0, localPE = 0, localPP = 0;
    let visitantePG = 0, visitantePE = 0, visitantePP = 0;

    if (puntosLocal > puntosVisitante) {
      localPG = 1; visitantePP = 1;
    } else if (puntosLocal < puntosVisitante) {
      localPP = 1; visitantePG = 1;
    } else {
      localPE = 1; visitantePE = 1;
    }

    await equipoLocal.update({
      partidosGanados: equipoLocal.partidosGanados + localPG,
      partidosEmpatados: equipoLocal.partidosEmpatados + localPE,
      partidosPerdidos: equipoLocal.partidosPerdidos + localPP,
      puntosFavor: equipoLocal.puntosFavor + puntosLocal,
      puntosEnContra: equipoLocal.puntosEnContra + puntosVisitante,
      partidosJugados: equipoLocal.partidosJugados + deltaLocalPJ,
      puntos: equipoLocal.puntos + (localPG * 3 + localPE),
      diferencia: equipoLocal.diferencia + (puntosLocal - puntosVisitante),
    }, { transaction: t });

    await equipoVisitante.update({
      partidosGanados: equipoVisitante.partidosGanados + visitantePG,
      partidosEmpatados: equipoVisitante.partidosEmpatados + visitantePE,
      partidosPerdidos: equipoVisitante.partidosPerdidos + visitantePP,
      puntosFavor: equipoVisitante.puntosFavor + puntosVisitante,
      puntosEnContra: equipoVisitante.puntosEnContra + puntosLocal,
      partidosJugados: equipoVisitante.partidosJugados + deltaVisitantePJ,
      puntos: equipoVisitante.puntos + (visitantePG * 3 + visitantePE),
      diferencia: equipoVisitante.diferencia + (puntosVisitante - puntosLocal),
    }, { transaction: t });

    await t.commit();
    t = null;

    const partidoFinal = await Partido.findByPk(partido.idPartido, {
      include: [
        {
          model: Equipo,
          as: 'equipoLocal',
          attributes: ['idEquipo', 'nombre', 'partidosGanados', 'partidosEmpatados', 'partidosPerdidos', 'puntosFavor', 'puntosEnContra', 'puntos', 'partidosJugados', 'diferencia'],
        },
        {
          model: Equipo,
          as: 'equipoVisitante',
          attributes: ['idEquipo', 'nombre', 'partidosGanados', 'partidosEmpatados', 'partidosPerdidos', 'puntosFavor', 'puntosEnContra', 'puntos', 'partidosJugados', 'diferencia'],
        },
      ],
    });

    res.json(partidoFinal);
  } catch (error) {
    if (t) await t.rollback();
    console.error('Error al cargar resultado:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = { getAll, getById, create, update, destroy, cargarResultado };
