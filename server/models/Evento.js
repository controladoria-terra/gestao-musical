const mongoose = require('mongoose');

const eventoSchema = new mongoose.Schema(
  {
    titulo: {
      type: String,
      required: [true, 'O título do evento é obrigatório'],
      trim: true
    },
    data: {
      type: Date
    },
    horario: {
      type: String,
      trim: true
    },
    perfil: {
      type: String,
      trim: true
    },
    periodo: {
      type: String,
      trim: true
    },
    fornecedor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Fornecedor',
      default: null
    },
    artista_nome: {
      type: String,
      trim: true
    },
    local: {
      type: String,
      trim: true
    },
    valor: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['pendente', 'confirmado', 'realizado', 'cancelado'],
      default: 'pendente'
    },
    nf_entregue: {
      type: Boolean,
      default: false
    },
    nf_numero: {
      type: String,
      trim: true
    },
    recebedor: {
      type: String,
      trim: true
    },
    pix_key: {
      type: String,
      trim: true
    },
    telefone_pagamento: {
      type: String,
      trim: true
    },
    data_programado: {
      type: Date
    },
    calendar_event_id: {
      type: String,
      trim: true
    },
    tema_mes: {
      type: String,
      trim: true
    },
    observacoes: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Evento', eventoSchema);
