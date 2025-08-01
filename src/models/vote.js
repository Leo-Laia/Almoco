const { mongoose } = require('../config/db');

const voteSchema = new mongoose.Schema({
  voterId: {
    type: String,
    required: true,
    trim: true,
  },
  date: {
    type: String, // formato "YYYY-MM-DD"
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

module.exports = mongoose.model('Vote', voteSchema);