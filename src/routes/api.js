const express = require('express');
const Vote = require('../models/vote');

const router = express.Router();
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function getPeriodOrToday(start, end) {
  const today = new Date().toISOString().slice(0, 10);
  const from = start || today;
  const to = end || from;

  if (!ISO_DATE_REGEX.test(from) || !ISO_DATE_REGEX.test(to)) {
    return { error: 'Datas inválidas. Use o formato YYYY-MM-DD.' };
  }

  if (to < from) {
    return { error: 'Período inválido. A data final deve ser maior ou igual à inicial.' };
  }

  return { from, to };
}

// POST /api/voto — registra um novo voto
router.post('/voto', async (req, res) => {
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
router.get('/avaliacoes', async (req, res) => {
  try {
    const { start, end } = req.query;
    const period = getPeriodOrToday(start, end);
    if (period.error) {
      return res.status(400).json({ error: period.error });
    }

    const { from, to } = period;

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
router.get('/comentarios', async (req, res) => {
  try {
    const { start, end, q, minLikes } = req.query;
    const period = getPeriodOrToday(start, end);
    if (period.error) {
      return res.status(400).json({ error: period.error });
    }

    const { from, to } = period;

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
router.post('/comentarios/:id/react', async (req, res) => {
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

module.exports = router;
