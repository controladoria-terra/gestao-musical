const mongoose = require('mongoose');

const defaultPermissions = {
  viewEventos: true,       // Ver programação musical
  viewAgenda: true,         // Ver agenda/calendário
  viewFornecedores: true,   // Ver fornecedores (sem dados financeiros)
  viewFinanceiro: false,    // Ver valores, cachet, pagamentos, NF
  viewRelatorios: false,    // Ver relatórios (contém dados financeiros)
  viewSincronizacao: false, // Ver painel de sincronização
  viewAdmin: false,         // Ver painel admin
};

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'O nome é obrigatório'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'O email é obrigatório'],
      unique: true,
      trim: true,
      lowercase: true
    },
    password: {
      type: String,
      required: [true, 'A senha é obrigatório'],
      minlength: 4
    },
    role: {
      type: String,
      enum: ['admin', 'viewer'],
      default: 'viewer'
    },
    permissions: {
      viewEventos: { type: Boolean, default: true },
      viewAgenda: { type: Boolean, default: true },
      viewFornecedores: { type: Boolean, default: true },
      viewFinanceiro: { type: Boolean, default: false },
      viewRelatorios: { type: Boolean, default: false },
      viewSincronizacao: { type: Boolean, default: false },
      viewAdmin: { type: Boolean, default: false },
    },
    active: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Helper: get permissions for a user (admin gets all true)
userSchema.methods.getEffectivePermissions = function() {
  if (this.role === 'admin') {
    return {
      viewEventos: true,
      viewAgenda: true,
      viewFornecedores: true,
      viewFinanceiro: true,
      viewRelatorios: true,
      viewSincronizacao: true,
      viewAdmin: true,
    };
  }
  return this.permissions || defaultPermissions;
};

module.exports = mongoose.model('User', userSchema);
module.exports.defaultPermissions = defaultPermissions;
