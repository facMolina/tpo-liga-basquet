const express = require('express');
const router = express.Router();
const partidoController = require('../controllers/partidoController');
const authenticateJWT = require('../middleware/auth');

router.get('/', partidoController.getAll);
router.get('/:id', partidoController.getById);
router.post('/', authenticateJWT, partidoController.create);
router.put('/:id', authenticateJWT, partidoController.update);
router.delete('/:id', authenticateJWT, partidoController.destroy);
router.post('/:id/resultado', authenticateJWT, partidoController.cargarResultado);

module.exports = router;
