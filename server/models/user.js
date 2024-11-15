// models/User.js
const mongoose = require("mongoose");

// Define the schema for the users collection
const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true, // Email should be unique
  },
  password: {
    type: String,
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
});

// Create and export the User model
const User = mongoose.model("User", userSchema, "users"); // Explicitly set the collection name as 'users'
module.exports = User;
