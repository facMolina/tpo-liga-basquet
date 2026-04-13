const express = require('express');
const router = express.Router();
const jugadorController = require('../controllers/jugadorController');
const authenticateJWT = require('../middleware/auth');

router.get('/', jugadorController.getAll);
router.get('/:id', jugadorController.getById);
router.post('/', authenticateJWT, jugadorController.create);
router.put('/:id', authenticateJWT, jugadorController.update);
router.delete('/:id', authenticateJWT, jugadorController.destroy);

module.exports = router;
