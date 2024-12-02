const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',  
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  likes: {
    count: { type: Number, default: 0 }, 
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  comments: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
      content: { type: String, required: true }, 
      createdAt: { type: Date, default: Date.now }, 
    },
  ],
});

const Post = mongoose.model('Post', postSchema);
module.exports = Post;
