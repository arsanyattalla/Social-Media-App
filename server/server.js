const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); 
require('dotenv').config();
const userRoutes = require('./routes/UserRoutes'); 
const session = require("express-session");
const MongoStore = require("connect-mongo");

const app = express();
const port = process.env.PORT || 5000;
const ENV = process.env.ENV
const dbURI = process.env.DB_URI;

if (!dbURI) {
  console.error('Error: Missing DB_URI in .env file');
  process.exit(1);
}

const corsOptions = {
  origin: ENV, 
  credentials: true, 
};
app.use(cors(corsOptions));


const sessionId = require('crypto').randomBytes(16).toString('hex');  // Generate a unique session ID
app.use(session({
  secret: 'yourSecretKey',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: dbURI,
    collectionName: 'sessions',
    ttl: 14 * 24 * 60 * 60,  // Optional: TTL for session
  }),
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24,
    sessionID: sessionId,  // Assign the unique session ID to the cookie
  },
}));
app.use(express.json());

mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log('Error connecting to MongoDB:', err));

app.get('/', (req, res) => {
  res.send('Welcome to the Backend API');
});

app.use('/api', userRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`); 
});
