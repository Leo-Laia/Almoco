// models/Vote.js
const { Schema, model } = require('mongoose');

const voteSchema = new Schema({
  item: {
    type: String,
    required: true,
    trim: true,
  },
  votes: {
    type: Number,
    default: 1,
    min: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = model('Vote', voteSchema);
