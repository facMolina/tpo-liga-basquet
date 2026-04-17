const express = require('express');
const router = express.Router();
const jugadorController = require('../controllers/jugadorController');
const authenticateJWT = require('../middleware/auth');
const validateId = require('../middleware/validateId');

router.get('/', jugadorController.getAll);
router.get('/:id', validateId, jugadorController.getById);
router.post('/', authenticateJWT, jugadorController.create);
router.put('/:id', validateId, authenticateJWT, jugadorController.update);
router.delete('/:id', validateId, authenticateJWT, jugadorController.destroy);

module.exports = router;
