const sequelize = require('../config/database');
const { Liga, Equipo, Jugador } = require('../models');

const equiposData = [
  {
    nombre: 'Halcones Rojos',
    entrenador: 'Carlos Méndez',
    jugadores: [
      { nombre: 'Lucas', apellido: 'García', categoria: 'Juvenil' },
      { nombre: 'Mateo', apellido: 'Fernández', categoria: 'Juvenil' },
      { nombre: 'Tomás', apellido: 'López', categoria: 'Juvenil' },
      { nombre: 'Joaquín', apellido: 'Ramírez', categoria: 'Juvenil' },
      { nombre: 'Bruno', apellido: 'Suárez', categoria: 'Juvenil' },
    ],
  },
  {
    nombre: 'Tigres Azules',
    entrenador: 'Roberto Álvarez',
    jugadores: [
      { nombre: 'Diego', apellido: 'Martínez', categoria: 'Juvenil' },
      { nombre: 'Nicolás', apellido: 'Ruiz', categoria: 'Juvenil' },
      { nombre: 'Santiago', apellido: 'Pereyra', categoria: 'Juvenil' },
      { nombre: 'Facundo', apellido: 'Romero', categoria: 'Juvenil' },
      { nombre: 'Ignacio', apellido: 'Torres', categoria: 'Juvenil' },
    ],
  },
  {
    nombre: 'Águilas Doradas',
    entrenador: 'Javier Sosa',
    jugadores: [
      { nombre: 'Agustín', apellido: 'Gómez', categoria: 'Juvenil' },
      { nombre: 'Manuel', apellido: 'Díaz', categoria: 'Juvenil' },
      { nombre: 'Valentín', apellido: 'Rojas', categoria: 'Juvenil' },
      { nombre: 'Emiliano', apellido: 'Castro', categoria: 'Juvenil' },
      { nombre: 'Gonzalo', apellido: 'Vega', categoria: 'Juvenil' },
    ],
  },
  {
    nombre: 'Lobos Plateados',
    entrenador: 'Hernán Acosta',
    jugadores: [
      { nombre: 'Franco', apellido: 'Molina', categoria: 'Juvenil' },
      { nombre: 'Julián', apellido: 'Herrera', categoria: 'Juvenil' },
      { nombre: 'Lautaro', apellido: 'Ortiz', categoria: 'Juvenil' },
      { nombre: 'Maximiliano', apellido: 'Silva', categoria: 'Juvenil' },
      { nombre: 'Benjamín', apellido: 'Cabrera', categoria: 'Juvenil' },
    ],
  },
];

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('Conexión establecida para el seed.');
    await sequelize.sync();

    const ligaNombre = process.env.LIGA_NAME || 'Liga de Basquet Juvenil';
    const [liga, ligaCreated] = await Liga.findOrCreate({
      where: { nombre: ligaNombre },
      defaults: {
        temporada: process.env.LIGA_TEMPORADA || '1C 2026',
        descripcion: process.env.LIGA_DESCRIPCION || 'Liga oficial TPO',
      },
    });
    console.log(ligaCreated ? `Liga creada: ${liga.nombre}` : `Liga ya existía: ${liga.nombre}`);

    for (const data of equiposData) {
      const [equipo, equipoCreated] = await Equipo.findOrCreate({
        where: { nombre: data.nombre },
        defaults: { nombre: data.nombre, entrenador: data.entrenador, idLiga: liga.idLiga },
      });
      console.log(equipoCreated ? `Equipo creado: ${equipo.nombre}` : `Equipo ya existía: ${equipo.nombre}`);

      for (const jugador of data.jugadores) {
        const [j, jCreated] = await Jugador.findOrCreate({
          where: { nombre: jugador.nombre, apellido: jugador.apellido, idEquipo: equipo.idEquipo },
          defaults: { ...jugador, idEquipo: equipo.idEquipo },
        });
        console.log(jCreated ? `Jugador creado: ${j.nombre} ${j.apellido} (${equipo.nombre})` : `Jugador ya existía: ${j.nombre} ${j.apellido}`);
      }
    }

    console.log('Seed de liga, equipos y jugadores finalizado correctamente.');
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Error al hacer el seed:', error);
    try { await sequelize.close(); } catch (_) { /* swallow: ya estamos en error path */ }
    process.exit(1);
  }
}

seed();
