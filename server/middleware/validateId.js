const validateId = (req, res, next) => {
  const rawId = req.params.id;
  if (!/^\d+$/.test(rawId)) {
    return res.status(400).json({ error: 'El ID debe ser un entero positivo' });
  }
  const id = Number(rawId);
  if (id <= 0) {
    return res.status(400).json({ error: 'El ID debe ser un entero positivo' });
  }
  req.params.id = id;
  next();
};

module.exports = validateId;
