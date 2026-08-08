const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const fornecedoresRouter = require('./routes/fornecedores');
const eventosRouter = require('./routes/eventos');
const dashboardRouter = require('./routes/dashboard');
const authRouter = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://mongodb-4-s9pz-mongodb4-1:27017/gestao-musical';

// Middleware
app.use(cors());
app.use(express.json({ limit: '15mb' }));

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/fornecedores', fornecedoresRouter);
app.use('/api/eventos', eventosRouter);
app.use('/api/dashboard', dashboardRouter);

// Serve static files from React build directory
const clientDistPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

// SPA fallback for non-API routes
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Rota de API não encontrada' });
  }
  const indexPath = path.join(clientDistPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Build do React não encontrado em client/dist.');
  }
});

// Connect to MongoDB and start server
mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    console.log('Conectado ao MongoDB:', MONGODB_URI);

    const User = require('./models/User');
    const bcrypt = require('bcryptjs');
    const userCount = await User.countDocuments();

    if (userCount === 0) {
      // Fresh install - create admin
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('terra123', salt);
      await User.create({
        name: 'Administrador',
        email: 'controladoria@terraparque.com.br',
        password: hashedPassword,
        role: 'admin'
      });
      console.log('Usuário admin criado: controladoria@terraparque.com.br / terra123');
    } else {
      // Migration: ensure admin has correct credentials
      const admin = await User.findOne({ email: 'controladoria@terraparque.com.br' });
      if (admin) {
        // Check if password needs update (from 123mudar to terra123)
        const isOldPassword = await bcrypt.compare('123mudar', admin.password);
        if (isOldPassword) {
          const salt = await bcrypt.genSalt(10);
          admin.password = await bcrypt.hash('terra123', salt);
          await admin.save();
          console.log('Senha admin atualizada para: terra123');
        }
      } else {
        // Check for old admin email
        const oldAdmin = await User.findOne({ email: 'admin@terraparque.com' });
        if (oldAdmin) {
          const salt = await bcrypt.genSalt(10);
          oldAdmin.email = 'controladoria@terraparque.com.br';
          oldAdmin.password = await bcrypt.hash('terra123', salt);
          oldAdmin.name = 'Administrador';
          oldAdmin.role = 'admin';
          await oldAdmin.save();
          console.log('Admin migrado: controladoria@terraparque.com.br / terra123');
        }
      }

      // Also update any viewer users created with 123mudar to terra123
      const viewers = await User.find({ role: 'viewer' });
      for (const v of viewers) {
        const isOldPass = await bcrypt.compare('123mudar', v.password);
        if (isOldPass) {
          const salt = await bcrypt.genSalt(10);
          v.password = await bcrypt.hash('terra123', salt);
          await v.save();
          console.log(`Senha atualizada para: ${v.email}`);
        }
      }
    }

    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Erro ao conectar ao MongoDB:', err.message);
  });

module.exports = app;
