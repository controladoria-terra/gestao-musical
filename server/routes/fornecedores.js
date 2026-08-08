const express = require('express');
const router = express.Router();
const multer = require('multer');
const Fornecedor = require('../models/Fornecedor');
const { authMiddleware, requireAdmin } = require('../middleware/auth');

// Configure multer for file upload (store in memory as base64)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não suportado. Use PDF, JPG, PNG ou WebP.'));
    }
  }
});

// GET /api/fornecedores - List all fornecedores (with optional ?search=)
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};
    if (search) {
      query.$or = [
        { nome: { $regex: search, $options: 'i' } },
        { responsavel: { $regex: search, $options: 'i' } },
        { tipo: { $regex: search, $options: 'i' } }
      ];
    }
    // Don't return the base64 file data in list view (too large)
    const fornecedores = await Fornecedor.find(query)
      .select('-nf_arquivo')
      .sort({ nome: 1 });
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

// GET /api/fornecedores/:id/nf - Download/view NF file
router.get('/:id/nf', async (req, res) => {
  try {
    const fornecedor = await Fornecedor.findById(req.params.id);
    if (!fornecedor) {
      return res.status(404).json({ error: 'Fornecedor não encontrado' });
    }
    if (!fornecedor.nf_arquivo) {
      return res.status(404).json({ error: 'Nenhuma nota fiscal anexada' });
    }
    const buffer = Buffer.from(fornecedor.nf_arquivo, 'base64');
    res.set('Content-Type', fornecedor.nf_arquivo_tipo || 'application/pdf');
    res.set('Content-Disposition', `inline; filename="${fornecedor.nf_arquivo_nome || 'nota-fiscal.pdf'}"`);
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao baixar nota fiscal', details: error.message });
  }
});

// POST /api/fornecedores - Create a new fornecedor (admin only)
router.post('/', authMiddleware, requireAdmin, async (req, res) => {
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

// PUT /api/fornecedores/:id - Update fornecedor by ID (admin only)
router.put('/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const fornecedor = await Fornecedor.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-nf_arquivo');
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

// POST /api/fornecedores/:id/nf - Upload NF file (admin only)
router.post('/:id/nf', authMiddleware, requireAdmin, upload.single('nf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }
    const base64File = req.file.buffer.toString('base64');
    const fornecedor = await Fornecedor.findByIdAndUpdate(
      req.params.id,
      {
        nf_arquivo: base64File,
        nf_arquivo_nome: req.file.originalname,
        nf_arquivo_tipo: req.file.mimetype,
        status_pagamento: 'enviado'
      },
      { new: true }
    ).select('-nf_arquivo');
    if (!fornecedor) {
      return res.status(404).json({ error: 'Fornecedor não encontrado' });
    }
    res.json({ message: 'Nota fiscal anexada com sucesso', fornecedor });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao enviar nota fiscal', details: error.message });
  }
});

// DELETE /api/fornecedores/:id/nf - Remove NF file (admin only)
router.delete('/:id/nf', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const fornecedor = await Fornecedor.findByIdAndUpdate(
      req.params.id,
      {
        nf_arquivo: null,
        nf_arquivo_nome: null,
        nf_arquivo_tipo: null
      },
      { new: true }
    ).select('-nf_arquivo');
    if (!fornecedor) {
      return res.status(404).json({ error: 'Fornecedor não encontrado' });
    }
    res.json({ message: 'Nota fiscal removida com sucesso', fornecedor });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover nota fiscal', details: error.message });
  }
});

// PATCH /api/fornecedores/:id/pagamento - Update payment status (admin only)
router.patch('/:id/pagamento', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { status_pagamento, data_pagamento } = req.body;
    const update = {};
    if (status_pagamento) update.status_pagamento = status_pagamento;
    if (data_pagamento) update.data_pagamento = data_pagamento;
    if (status_pagamento === 'pago') {
      update.enviado_financeiro = true;
      if (!update.data_pagamento) update.data_pagamento = new Date();
    }
    const fornecedor = await Fornecedor.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    ).select('-nf_arquivo');
    if (!fornecedor) {
      return res.status(404).json({ error: 'Fornecedor não encontrado' });
    }
    res.json({ message: 'Status de pagamento atualizado', fornecedor });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar pagamento', details: error.message });
  }
});

// DELETE /api/fornecedores/:id - Delete fornecedor by ID (admin only)
router.delete('/:id', authMiddleware, requireAdmin, async (req, res) => {
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
