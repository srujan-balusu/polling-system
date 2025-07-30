const mongoose = require('mongoose');
const { Schema } = mongoose;

const pollSchema = new Schema({
  question:   { type: String, required: true },
  options:    [{ text: String, votes: { type: Number, default: 0 } }],
  duration:   { type: Number, required: true },
  createdAt:  { type: Date, default: Date.now },
  isActive:   { type: Boolean, default: true },
});

module.exports = mongoose.model('Poll', pollSchema);
