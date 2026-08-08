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

    // Auto-seed admin user if none exists
    const User = require('./models/User');
    const bcrypt = require('bcryptjs');
    const userCount = await User.countDocuments();

    if (userCount === 0) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('123mudar', salt);
      await User.create({
        name: 'Administrador',
        email: 'controladoria@terraparque.com.br',
        password: hashedPassword,
        role: 'admin'
      });
      console.log('Usuário admin criado: controladoria@terraparque.com.br / 123mudar');
    } else {
      // Migration: update old admin credentials to new ones
      const oldAdmin = await User.findOne({ email: 'admin@terraparque.com' });
      if (oldAdmin) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('123mudar', salt);
        oldAdmin.email = 'controladoria@terraparque.com.br';
        oldAdmin.password = hashedPassword;
        oldAdmin.name = 'Administrador';
        oldAdmin.role = 'admin';
        await oldAdmin.save();
        console.log('Admin migrado: controladoria@terraparque.com.br / 123mudar');
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
