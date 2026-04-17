const express = require('express');
const router = express.Router();
const equipoController = require('../controllers/equipoController');
const authenticateJWT = require('../middleware/auth');
const validateId = require('../middleware/validateId');

router.get('/', equipoController.getAll);
router.get('/:id', validateId, equipoController.getById);
router.post('/', authenticateJWT, equipoController.create);
router.put('/:id', validateId, authenticateJWT, equipoController.update);
router.delete('/:id', validateId, authenticateJWT, equipoController.destroy);

module.exports = router;
