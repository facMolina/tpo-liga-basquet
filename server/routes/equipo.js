const express = require('express');
const router = express.Router();
const equipoController = require('../controllers/equipoController');
const authenticateJWT = require('../middleware/auth');

router.get('/', equipoController.getAll);
router.get('/:id', equipoController.getById);
router.post('/', authenticateJWT, equipoController.create);
router.put('/:id', authenticateJWT, equipoController.update);
router.delete('/:id', authenticateJWT, equipoController.destroy);

module.exports = router;
