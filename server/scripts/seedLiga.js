const sequelize = require('../config/database');
const { Liga } = require('../models');

async function seedLiga() {
  try {
    await sequelize.authenticate();
    console.log('Conexión establecida para el seed.');
    await sequelize.sync();

    const existing = await Liga.findOne({ where: { nombre: 'Liga de Basquet Juvenil' } });
    if (existing) {
      console.log('La liga ya existe.');
      await sequelize.close();
      process.exit(0);
      return;
    }

    await Liga.create({
      nombre: process.env.LIGA_NAME || 'Liga de Basquet Juvenil',
      temporada: process.env.LIGA_TEMPORADA || '1C 2026',
      descripcion: process.env.LIGA_DESCRIPCION || 'Liga oficial TPO',
    });

    console.log('Liga creada exitosamente.');
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Error al hacer el seed de liga:', error);
    await sequelize.close();
    process.exit(1);
  }
}

seedLiga();
