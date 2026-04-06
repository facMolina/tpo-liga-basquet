const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');
const { Usuario } = require('../models');

async function seedAdmin() {
  try {
    await sequelize.authenticate();
    console.log('Conexión establecida para el seed.');
    await sequelize.sync(); // Asegura de que la tabla exista

    const adminUser = 'admin';
    const adminPassword = 'adminpassword';
    
    // Check if exists
    const existing = await Usuario.findOne({ where: { usuario: adminUser } });
    if (existing) {
      console.log('El usuario administrador ya existe.');
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(adminPassword, salt);

    await Usuario.create({
      usuario: adminUser,
      password_hash
    });

    console.log('Usuario administrador creado exitosamente.');
  } catch (error) {
    console.error('Error al hacer el seed:', error);
  } finally {
    process.exit(0);
  }
}

seedAdmin();
