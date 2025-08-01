require('dotenv').config();
const express = require('express');
const path = require('path');
const { version } = require('./package.json');
const { connectDB } = require('./src/config/db');
const apiRoutes = require('./src/routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json());
app.use(express.static('public'));

// Endpoint para versão da aplicação
app.get('/api/version', (req, res) => {
  res.json({ version });
});

// Rotas da API
app.use('/api', apiRoutes);

// Rota para página de resumo
app.get('/resumo', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'resumo.html'));
});

// Conecta ao MongoDB e inicia o servidor
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server ouvindo na porta ${PORT}`);
  });
});
