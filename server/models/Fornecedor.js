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
    enviado_financeiro: {
      type: Boolean,
      default: false
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
