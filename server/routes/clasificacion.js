const express = require('express');
const router = express.Router();
const clasificacionController = require('../controllers/clasificacionController');

router.get('/', clasificacionController.getClasificacion);

module.exports = router;
