const mongoose = require('mongoose');

// Define a session schema
const sessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sessionId: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
});
// Allow multiple sessions for the same user
sessionSchema.index({ user_id: 1, createdAt: 1 });

// Create and export the model
const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;
