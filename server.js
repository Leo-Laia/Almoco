const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

const DATA_FILE = path.join(__dirname, 'votes.json');
function readData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch {
    return { votes: [] };
  }
}
function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

app.use(express.json());
app.use(express.static('public'));

// POST /api/voto
app.post('/api/voto', (req, res) => {
  const { voterId, notas, comment } = req.body;
  if (!voterId || !notas) return res.status(400).json({ error: 'Dados incompletos' });

  const data = readData();
  const today = new Date().toISOString().slice(0,10);
  if (data.votes.find(v => v.voterId === voterId && v.date === today)) {
    return res.status(400).json({ error: 'Você já votou hoje' });
  }

  data.votes.push({ voterId, date: today, notas, comment });
  writeData(data);
  res.status(201).json({ message: 'Voto registrado' });
});

// GET /api/avaliacoes
/**app.get('/api/avaliacoes', (req, res) => {
  const data = readData();
  const today = new Date().toISOString().slice(0,10);
  const todays = data.votes.filter(v => v.date === today);

  const criteria = ['variedade','sabor','qualidade','sobremesa','atendimento'];
  const avg = {};
  criteria.forEach(c => {
    const sum = todays.reduce((s, v) => s + (v.notas[c]||0), 0);
    avg[c] = todays.length ? +(sum / todays.length).toFixed(2) : 0;
  });

  res.json({ avg, count: todays.length });
});**/
app.get('/api/avaliacoes', (req, res) => {
  const data = readData();
  const { start, end } = req.query;

  // se não vier nada, usa só hoje
  const from = start || new Date().toISOString().slice(0,10);
  const to   = end   || from;

  // filtra votes entre from e to (inclusive)
  const votes = data.votes.filter(v =>
    v.date >= from && v.date <= to
  );

  const criteria = ['variedade','sabor','qualidade','sobremesa','atendimento'];
  const avg = {};
  criteria.forEach(c => {
    const sum = votes.reduce((s, v) => s + (v.notas[c]||0), 0);
    avg[c] = votes.length ? +(sum / votes.length).toFixed(2) : 0;
  });

  res.json({ avg, count: votes.length, period: { from, to } });
});

// GET /api/comentarios
/**app.get('/api/comentarios', (req, res) => {
  const data = readData();
  const today = new Date().toISOString().slice(0,10);
  const comments = data.votes
    .filter(v => v.date === today && v.comment && v.comment.trim())
    .map(v => v.comment);
  res.json({ comments });
});**/
app.get('/api/comentarios', (req, res) => {
  const data = readData();
  const { start, end } = req.query;
  const from = start || new Date().toISOString().slice(0,10);
  const to   = end   || from;

  const comments = data.votes
    .filter(v =>
      v.date >= from &&
      v.date <= to &&
      v.comment &&
      v.comment.trim()
    )
    .map(v => ({
      date: v.date,
      comment: v.comment.trim()
    }));

  res.json({ comments, period: { from, to }, count: comments.length });
});



app.get('/resumo', (req,res) => {
  res.sendFile(path.join(__dirname, 'public', 'resumo.html'));
});

app.listen(PORT, () => {
  console.log(`Server ouvindo na porta ${PORT}`);
});
