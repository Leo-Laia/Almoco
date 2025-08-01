require('dotenv').config();
const express = require('express');
const path = require('path');
const { version } = require('./package.json');
const { connectDB } = require('./src/config/db');
const apiRoutes = require('./src/routes/api');
const session = require('express-session');
const passport = require('passport');
const setupGoogleStrategy = require('./src/auth/google');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());
setupGoogleStrategy();

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/auth/google');
}

app.get('/auth/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
}));

app.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/');
  }
);

app.get('/logout', (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    res.redirect('/');
  });
});

app.use(express.static('public'));

app.get('/api/user', (req, res) => {
  res.json({ user: req.user || null });
});

// Endpoint para versão da aplicação
app.get('/api/version', (req, res) => {
  res.json({ version });
});

// Rotas da API
app.use('/api', ensureAuthenticated, apiRoutes);

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
