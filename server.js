require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const { version } = require('./package.json');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json());
app.use(express.static('public'));

// Endpoint para versão da aplicação
app.get('/api/version', (req, res) => {
  res.json({ version });
});

// Conexão com MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log(`✅ MongoDB conectado! URI: ${process.env.MONGODB_HOST}`))
  .catch(err => {
    console.error('❌ Erro ao conectar no MongoDB:', err);
    process.exit(1);
  });

// Definição do schema/model de voto
const voteSchema = new mongoose.Schema({
  voterId: {
    type: String,
    required: true,
    trim: true,
  },
  date: {
    type: String, // armazenamos no formato "YYYY-MM-DD"
    required: true,
  },
  notas: {
    variedade:   { type: Number, min: 0, default: null },
    sabor:       { type: Number, min: 0, default: null },
    qualidade:   { type: Number, min: 0, default: null },
    carne:       { type: Number, min: 0, default: null },
    sobremesa:   { type: Number, min: 0, default: null },
    atendimento: { type: Number, min: 0, default: null },
  },
  comment: {
    type: String,
    trim: true,
    default: '',
  },
  likes: {
    type: Number,
    default: 0,
    min: 0,
  },
  dislikes: {
    type: Number,
    default: 0,
    min: 0,
  },
});

const Vote = mongoose.model('Vote', voteSchema);

// POST /api/voto — registra um novo voto
app.post('/api/voto', async (req, res) => {
  try {
    const { voterId, notas, comment } = req.body;
    if (!voterId || !notas) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }

    const today = new Date().toISOString().slice(0, 10);
    const alreadyVoted = await Vote.findOne({ voterId, date: today });
    if (alreadyVoted) {
      return res.status(400).json({ error: 'Você já votou hoje' });
    }

    const vote = new Vote({ voterId, date: today, notas, comment });
    await vote.save();
    res.status(201).json({ message: 'Voto registrado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao registrar voto' });
  }
});

// GET /api/avaliacoes — retorna média das notas no período
app.get('/api/avaliacoes', async (req, res) => {
  try {
    const { start, end } = req.query;
    const from = start || new Date().toISOString().slice(0, 10);
    const to   = end   || from;

    const votes = await Vote.find({
      date: { $gte: from, $lte: to }
    });

    const criteria = ['variedade', 'sabor', 'qualidade', 'carne', 'sobremesa', 'atendimento'];
    const avg = {};
    criteria.forEach(c => {
            const vals = votes.map(v => v.notas[c]).filter(v => v !== null && v !== undefined);
            const sum  = vals.reduce((s, v) => s + v, 0);
            avg[c] = vals.length ? +(sum / vals.length).toFixed(2) : 0;
    });

    res.json({ avg, count: votes.length, period: { from, to } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar avaliações' });
  }
});

// GET /api/comentarios — lista comentários no período
app.get('/api/comentarios', async (req, res) => {
  try {
    const { start, end, q, minLikes } = req.query;
    const from = start || new Date().toISOString().slice(0, 10);
    const to   = end   || from;

    const filter = {
      date: { $gte: from, $lte: to },
      comment: { $exists: true, $ne: '' }
    };
    if (q) {
      filter.comment = { ...filter.comment, $regex: q, $options: 'i' };
    }
    if (minLikes) {
      filter.likes = { $gte: Number(minLikes) };
    }

    const comments = await Vote.find(filter)
      .select('_id date comment likes dislikes')
      .sort({ likes: -1, dislikes: 1, date: -1 });

    res.json({ comments, period: { from, to }, count: comments.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar comentários' });
  }
});

// POST /api/comentarios/:id/react — registra uma reação em um comentário
app.post('/api/comentarios/:id/react', async (req, res) => {
  try {
    const { type } = req.body;
    if (type !== 'like' && type !== 'dislike') {
      return res.status(400).json({ error: 'Tipo inválido' });
    }
    const update = type === 'like' ? { $inc: { likes: 1 } } : { $inc: { dislikes: 1 } };
    const vote = await Vote.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!vote) return res.status(404).json({ error: 'Comentário não encontrado' });
    res.json({ likes: vote.likes, dislikes: vote.dislikes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao registrar reação' });
  }
});

// GET /resumo — serve página estática de resumo
app.get('/resumo', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'resumo.html'));
});

// Inicia servidor
app.listen(PORT, () => {
  console.log(`🚀 Server ouvindo na porta ${PORT}`);
});
