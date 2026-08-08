const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authMiddleware, requireAdmin, JWT_SECRET } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }
    const user = await User.findOne({ email: email.toLowerCase().trim(), active: true });
    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.getEffectivePermissions()
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao fazer login', details: error.message });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json({ user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.getEffectivePermissions()
    }});
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar usuário', details: error.message });
  }
});

// POST /api/auth/invite (admin only) - Invite user by email with role and permissions
router.post('/invite', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { email, name, role, permissions } = req.body;
    if (!email || !name) {
      return res.status(400).json({ error: 'Nome e email são obrigatórios' });
    }
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ error: 'Este email já está cadastrado' });
    }
    // Default password for invited users
    const defaultPassword = 'terra123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(defaultPassword, salt);

    // Build permissions object
    const userPermissions = {
      viewEventos: true,
      viewAgenda: true,
      viewFornecedores: permissions?.viewFornecedores ?? true,
      viewFinanceiro: permissions?.viewFinanceiro ?? false,
      viewRelatorios: permissions?.viewRelatorios ?? false,
      viewSincronizacao: permissions?.viewSincronizacao ?? false,
      viewAdmin: false,
    };

    // If role is admin, all permissions are true (via getEffectivePermissions)
    const user = await User.create({
      name,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: role || 'viewer',
      permissions: userPermissions,
    });

    res.status(201).json({
      message: `Usuário convidado! Login: ${user.email} | Senha: ${defaultPassword}`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.getEffectivePermissions()
      },
      defaultPassword
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao convidar usuário', details: error.message });
  }
});

// POST /api/auth/register (admin only) - kept for backwards compat
router.post('/register', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { name, email, password, role, permissions } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
    }
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userPermissions = {
      viewEventos: true,
      viewAgenda: true,
      viewFornecedores: permissions?.viewFornecedores ?? true,
      viewFinanceiro: permissions?.viewFinanceiro ?? false,
      viewRelatorios: permissions?.viewRelatorios ?? false,
      viewSincronizacao: permissions?.viewSincronizacao ?? false,
      viewAdmin: false,
    };

    const user = await User.create({
      name,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: role || 'viewer',
      permissions: userPermissions,
    });
    res.status(201).json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role, permissions: user.getEffectivePermissions() }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar usuário', details: error.message });
  }
});

// GET /api/auth/users (admin only)
router.get('/users', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ users: users.map(u => ({
      id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      permissions: u.getEffectivePermissions(),
      active: u.active,
      createdAt: u.createdAt
    })) });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar usuários', details: error.message });
  }
});

// PUT /api/auth/users/:id (admin only) - update name, role, permissions, password, active
router.put('/users/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { name, role, active, password, permissions } = req.body;
    const update = {};
    if (name) update.name = name;
    if (role) update.role = role;
    if (typeof active === 'boolean') update.active = active;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      update.password = await bcrypt.hash(password, salt);
    }
    if (permissions) {
      update.permissions = {
        viewEventos: permissions.viewEventos ?? true,
        viewAgenda: permissions.viewAgenda ?? true,
        viewFornecedores: permissions.viewFornecedores ?? true,
        viewFinanceiro: permissions.viewFinanceiro ?? false,
        viewRelatorios: permissions.viewRelatorios ?? false,
        viewSincronizacao: permissions.viewSincronizacao ?? false,
        viewAdmin: false,
      };
    }
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password');
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json({ user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.getEffectivePermissions(),
      active: user.active
    }});
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar usuário', details: error.message });
  }
});

// DELETE /api/auth/users/:id (admin only)
router.delete('/users/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Não é possível excluir seu próprio usuário' });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json({ message: 'Usuário excluído com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir usuário', details: error.message });
  }
});

module.exports = router;
