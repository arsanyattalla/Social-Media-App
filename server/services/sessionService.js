const Session = require('../models/session');
const { v4: uuidv4 } = require('uuid');

async function createSession(userId) {
  const sessionId = uuidv4(); // Generate unique session ID
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

  const newSession = new Session({
    userId,
    sessionId,
    expiresAt,
  });

  await newSession.save();
  return newSession;
}

module.exports = { createSession };
