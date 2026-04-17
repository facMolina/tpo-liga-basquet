const express = require('express');
const router = express.Router();
const partidoController = require('../controllers/partidoController');
const authenticateJWT = require('../middleware/auth');
const validateId = require('../middleware/validateId');

router.get('/', partidoController.getAll);
router.get('/:id', validateId, partidoController.getById);
router.post('/', authenticateJWT, partidoController.create);
router.put('/:id', validateId, authenticateJWT, partidoController.update);
router.delete('/:id', validateId, authenticateJWT, partidoController.destroy);
router.post('/:id/resultado', validateId, authenticateJWT, partidoController.cargarResultado);

module.exports = router;
