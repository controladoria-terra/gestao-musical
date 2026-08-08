const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const fornecedoresRouter = require('./routes/fornecedores');
const eventosRouter = require('./routes/eventos');
const dashboardRouter = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://mongodb-4-s9pz-mongodb4-1:27017/gestao-musical';

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
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
  .then(() => {
    console.log('Conectado ao MongoDB:', MONGODB_URI);
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Erro ao conectar ao MongoDB:', err.message);
  });

module.exports = app;
