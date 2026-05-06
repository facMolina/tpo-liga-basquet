const sequelize = require('../config/database');
const { Liga, Equipo, Jugador } = require('../models');

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('Conexión establecida para el seed.');
    await sequelize.sync();

    const ligaNombre = process.env.LIGA_NAME || 'Liga_1';
    const [liga, ligaCreated] = await Liga.findOrCreate({
      where: { nombre: ligaNombre },
      defaults: {
        temporada: process.env.LIGA_TEMPORADA || '1C 2026',
        descripcion: process.env.LIGA_DESCRIPCION || 'Liga oficial TPO',
      },
    });
    console.log(ligaCreated ? `Liga creada: ${liga.nombre}` : `Liga ya existía: ${liga.nombre}`);

    const equiposData = [
      { nombre: 'Equipo_1', entrenador: 'Coach_1' },
      { nombre: 'Equipo_2', entrenador: 'Coach_2' },
      { nombre: 'Equipo_3', entrenador: 'Coach_3' },
      { nombre: 'Equipo_4', entrenador: 'Coach_4' },
    ];
    const equipos = [];
    for (const data of equiposData) {
      const [e, created] = await Equipo.findOrCreate({ where: { nombre: data.nombre }, defaults: data });
      console.log(created ? `Equipo creado: ${e.nombre}` : `Equipo ya existía: ${e.nombre}`);
      equipos.push(e);
    }

    let idx = 1;
    for (const equipo of equipos) {
      for (let i = 0; i < 2; i++) {
        const nombre = `Jugador_${idx}`;
        const apellido = `Apellido_${idx}`;
        const [j, created] = await Jugador.findOrCreate({
          where: { nombre, apellido, idEquipo: equipo.idEquipo },
          defaults: { categoria: 'U17', idEquipo: equipo.idEquipo },
        });
        console.log(created ? `Jugador creado: ${j.nombre} ${j.apellido} (${equipo.nombre})` : `Jugador ya existía: ${j.nombre} ${j.apellido}`);
        idx++;
      }
    }

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Error al hacer el seed:', error);
    try { await sequelize.close(); } catch (_) { /* swallow: ya estamos en error path */ }
    process.exit(1);
  }
}

seed();
