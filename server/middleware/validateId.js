const validateId = (req, res, next) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'El ID debe ser un entero positivo' });
  }
  req.params.id = id;
  next();
};

module.exports = validateId;
