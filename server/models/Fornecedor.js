const mongoose = require('mongoose');

const fornecedorSchema = new mongoose.Schema(
  {
    nome: {
      type: String,
      required: [true, 'O nome do fornecedor é obrigatório'],
      trim: true
    },
    tipo: {
      type: String,
      trim: true
    },
    responsavel: {
      type: String,
      trim: true
    },
    recebedor: {
      type: String,
      trim: true
    },
    pix: {
      type: String,
      trim: true
    },
    cachet: {
      type: Number,
      default: 0
    },
    telefone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true
    },
    documento: {
      type: String,
      trim: true
    },
    notas_fiscais: {
      type: String,
      trim: true
    },
    // NF file attachment
    nf_arquivo: {
      type: String, // base64 encoded file
      default: null
    },
    nf_arquivo_nome: {
      type: String,
      default: null
    },
    nf_arquivo_tipo: {
      type: String,
      default: null
    },
    enviado_financeiro: {
      type: Boolean,
      default: false
    },
    // Payment status flags
    status_pagamento: {
      type: String,
      enum: ['nao_enviado', 'enviado', 'pago'],
      default: 'nao_enviado'
    },
    data_pagamento: {
      type: Date,
      default: null
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

module.exports = mongoose.model('Fornecedor', fornecedorSchema);
