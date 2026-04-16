const express = require('express');
const router = express.Router();
const ligaController = require('../controllers/ligaController');
const authenticateJWT = require('../middleware/auth');
const validateId = require('../middleware/validateId');

router.get('/', ligaController.getAll);
router.get('/:id', validateId, ligaController.getById);
router.post('/', authenticateJWT, ligaController.create);
router.put('/:id', validateId, authenticateJWT, ligaController.update);
router.delete('/:id', validateId, authenticateJWT, ligaController.destroy);

module.exports = router;
