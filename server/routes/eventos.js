const express = require('express');
const router = express.Router();
const Evento = require('../models/Evento');

// GET /api/eventos - List all eventos with optional ?search=, ?status=, ?fornecedor_id= filters
router.get('/', async (req, res) => {
  try {
    const { search, status, fornecedor_id } = req.query;
    let query = {};

    if (status) {
      query.status = status;
    }

    if (fornecedor_id) {
      query.fornecedor_id = fornecedor_id;
    }

    if (search) {
      query.$or = [
        { titulo: { $regex: search, $options: 'i' } },
        { artista_nome: { $regex: search, $options: 'i' } },
        { local: { $regex: search, $options: 'i' } }
      ];
    }

    const eventos = await Evento.find(query)
      .populate('fornecedor_id')
      .sort({ data: -1 });

    res.json(eventos);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar eventos', details: error.message });
  }
});

// GET /api/eventos/:id - Get single evento by ID (populate fornecedor_id)
router.get('/:id', async (req, res) => {
  try {
    const evento = await Evento.findById(req.params.id).populate('fornecedor_id');
    if (!evento) {
      return res.status(404).json({ error: 'Evento não encontrado' });
    }
    res.json(evento);
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ error: 'ID de evento inválido' });
    }
    res.status(500).json({ error: 'Erro ao buscar evento', details: error.message });
  }
});

// POST /api/eventos - Create a new evento
router.post('/', async (req, res) => {
  try {
    const eventData = { ...req.body };
    if (eventData.fornecedor_id === '' || eventData.fornecedor_id === undefined) {
      delete eventData.fornecedor_id;
    }

    const evento = new Evento(eventData);
    const savedEvento = await evento.save();
    const populatedEvento = await Evento.findById(savedEvento._id).populate('fornecedor_id');
    res.status(201).json(populatedEvento);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: 'Dados inválidos ao criar evento', details: error.message });
    }
    res.status(500).json({ error: 'Erro ao criar evento', details: error.message });
  }
});

// PUT /api/eventos/:id - Update evento by ID
router.put('/:id', async (req, res) => {
  try {
    const eventData = { ...req.body };
    if (eventData.fornecedor_id === '') {
      eventData.fornecedor_id = null;
    }

    const evento = await Evento.findByIdAndUpdate(
      req.params.id,
      eventData,
      { new: true, runValidators: true }
    ).populate('fornecedor_id');

    if (!evento) {
      return res.status(404).json({ error: 'Evento não encontrado' });
    }
    res.json(evento);
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ error: 'ID de evento inválido' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: 'Dados inválidos ao atualizar evento', details: error.message });
    }
    res.status(500).json({ error: 'Erro ao atualizar evento', details: error.message });
  }
});

// PATCH /api/eventos/:id - Partial update (used by Google Calendar sync)
router.patch('/:id', async (req, res) => {
  try {
    const evento = await Evento.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('fornecedor_id');

    if (!evento) {
      return res.status(404).json({ error: 'Evento não encontrado' });
    }
    res.json(evento);
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ error: 'ID de evento inválido' });
    }
    res.status(500).json({ error: 'Erro ao atualizar evento', details: error.message });
  }
});

// DELETE /api/eventos/:id - Delete evento by ID
router.delete('/:id', async (req, res) => {
  try {
    const evento = await Evento.findByIdAndDelete(req.params.id);
    if (!evento) {
      return res.status(404).json({ error: 'Evento não encontrado' });
    }
    res.json({ message: 'Evento removido com sucesso', id: req.params.id });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ error: 'ID de evento inválido' });
    }
    res.status(500).json({ error: 'Erro ao remover evento', details: error.message });
  }
});

module.exports = router;
