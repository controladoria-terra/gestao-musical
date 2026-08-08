const express = require('express');
const router = express.Router();
const Fornecedor = require('../models/Fornecedor');
const Evento = require('../models/Evento');

// GET /api/dashboard - Summary stats
router.get('/', async (req, res) => {
  try {
    const totalFornecedores = await Fornecedor.countDocuments();
    const totalEventos = await Evento.countDocuments();

    // Group events count by status
    const statusCounts = await Evento.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const eventosByStatus = {
      pendente: 0,
      confirmado: 0,
      realizado: 0,
      cancelado: 0
    };

    statusCounts.forEach((item) => {
      if (item._id && Object.prototype.hasOwnProperty.call(eventosByStatus, item._id)) {
        eventosByStatus[item._id] = item.count;
      }
    });

    // Sum total value of events
    const valorResult = await Evento.aggregate([
      { $group: { _id: null, total: { $sum: '$valor' } } }
    ]);
    const valorTotal = valorResult.length > 0 ? valorResult[0].total : 0;

    // Upcoming events: next 5 events sorted by date
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    let eventosProximos = await Evento.find({ data: { $gte: now } })
      .populate('fornecedor_id')
      .sort({ data: 1 })
      .limit(5);

    // If no upcoming events, fall back to next 5 sorted by date ascending
    if (eventosProximos.length === 0) {
      eventosProximos = await Evento.find({})
        .populate('fornecedor_id')
        .sort({ data: 1 })
        .limit(5);
    }

    res.json({
      totalFornecedores,
      totalEventos,
      eventosByStatus,
      valorTotal,
      eventosProximos
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao obter dados do dashboard', details: error.message });
  }
});

module.exports = router;
