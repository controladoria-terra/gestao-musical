const express = require('express');
const router = express.Router();
const Fornecedor = require('../models/Fornecedor');
const Evento = require('../models/Evento');

// GET /api/dashboard - Summary stats
router.get('/', async (req, res) => {
  try {
    const totalFornecedores = await Fornecedor.countDocuments();
    const totalEventos = await Evento.countDocuments();

    const statusCounts = await Evento.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const eventosByStatus = { pendente: 0, confirmado: 0, realizado: 0, cancelado: 0 };
    statusCounts.forEach((item) => {
      if (item._id && Object.prototype.hasOwnProperty.call(eventosByStatus, item._id)) {
        eventosByStatus[item._id] = item.count;
      }
    });

    const valorResult = await Evento.aggregate([
      { $group: { _id: null, total: { $sum: '$valor' } } }
    ]);
    const valorTotal = valorResult.length > 0 ? valorResult[0].total : 0;

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    let eventosProximos = await Evento.find({ data: { $gte: now } })
      .populate('fornecedor_id')
      .sort({ data: 1 })
      .limit(5);

    if (eventosProximos.length === 0) {
      eventosProximos = await Evento.find({})
        .populate('fornecedor_id')
        .sort({ data: 1 })
        .limit(5);
    }

    // === Enhanced stats for Relatórios ===
    
    // Events by month (aggregate by year-month)
    const byMonth = await Evento.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$data' } },
          count: { $sum: 1 },
          totalValor: { $sum: '$valor' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Events by local
    const byLocal = await Evento.aggregate([
      {
        $group: {
          _id: { $toUpper: { $trim: { input: '$local' } } },
          count: { $sum: 1 },
          totalValor: { $sum: '$valor' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Top fornecedores by value (join with fornecedor data)
    const topFornecedores = await Evento.aggregate([
      {
        $group: {
          _id: '$artista_nome',
          totalEventos: { $sum: 1 },
          totalValor: { $sum: '$valor' }
        }
      },
      { $sort: { totalValor: -1 } },
      { $limit: 10 }
    ]);

    // Calendar sync stats
    const withCalendar = await Evento.countDocuments({ calendar_event_id: { $exists: true, $ne: null, $ne: '' } });
    const withoutCalendar = totalEventos - withCalendar;

    // Eventos with NF
    const withNF = await Evento.countDocuments({ nf_entregue: true });

    res.json({
      totalFornecedores,
      totalEventos,
      eventosByStatus,
      valorTotal,
      eventosProximos,
      // Enhanced stats
      eventosPorMes: byMonth,
      eventosPorLocal: byLocal,
      topFornecedores,
      syncInfo: { withCalendar, withoutCalendar, withNF }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao obter dados do dashboard', details: error.message });
  }
});

module.exports = router;
