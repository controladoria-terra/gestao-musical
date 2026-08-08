const express = require('express');
const router = express.Router();
const Fornecedor = require('../models/Fornecedor');

// GET /api/fornecedores - List all fornecedores (with optional ?search= for filtering by name)
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};

    if (search) {
      query.nome = { $regex: search, $options: 'i' };
    }

    const fornecedores = await Fornecedor.find(query).sort({ nome: 1 });
    res.json(fornecedores);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar fornecedores', details: error.message });
  }
});

// GET /api/fornecedores/:id - Get single fornecedor by ID
router.get('/:id', async (req, res) => {
  try {
    const fornecedor = await Fornecedor.findById(req.params.id);
    if (!fornecedor) {
      return res.status(404).json({ error: 'Fornecedor não encontrado' });
    }
    res.json(fornecedor);
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ error: 'ID de fornecedor inválido' });
    }
    res.status(500).json({ error: 'Erro ao buscar fornecedor', details: error.message });
  }
});

// POST /api/fornecedores - Create a new fornecedor
router.post('/', async (req, res) => {
  try {
    const fornecedor = new Fornecedor(req.body);
    const savedFornecedor = await fornecedor.save();
    res.status(201).json(savedFornecedor);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: 'Dados inválidos ao criar fornecedor', details: error.message });
    }
    res.status(500).json({ error: 'Erro ao criar fornecedor', details: error.message });
  }
});

// PUT /api/fornecedores/:id - Update fornecedor by ID
router.put('/:id', async (req, res) => {
  try {
    const fornecedor = await Fornecedor.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!fornecedor) {
      return res.status(404).json({ error: 'Fornecedor não encontrado' });
    }
    res.json(fornecedor);
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ error: 'ID de fornecedor inválido' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: 'Dados inválidos ao atualizar fornecedor', details: error.message });
    }
    res.status(500).json({ error: 'Erro ao atualizar fornecedor', details: error.message });
  }
});

// DELETE /api/fornecedores/:id - Delete fornecedor by ID
router.delete('/:id', async (req, res) => {
  try {
    const fornecedor = await Fornecedor.findByIdAndDelete(req.params.id);
    if (!fornecedor) {
      return res.status(404).json({ error: 'Fornecedor não encontrado' });
    }
    res.json({ message: 'Fornecedor removido com sucesso', id: req.params.id });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ error: 'ID de fornecedor inválido' });
    }
    res.status(500).json({ error: 'Erro ao remover fornecedor', details: error.message });
  }
});

module.exports = router;
