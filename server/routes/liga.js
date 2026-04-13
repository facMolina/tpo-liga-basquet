const express = require('express');
const router = express.Router();
const ligaController = require('../controllers/ligaController');
const authenticateJWT = require('../middleware/auth');

router.get('/', ligaController.getAll);
router.get('/:id', ligaController.getById);
router.put('/:id', authenticateJWT, ligaController.update);

module.exports = router;
