const express = require("express");
const User = require("../models/user");
const router = express.Router();
const Post = require("../models/post")

router.post("/register", async (req, res) => {
  const {firstName,lastName, username, email, password } = req.body;
  console.log(req.body);
  try {
    const exisitingUser = await User.findOne({$or:[{username},{email}]})
    if(exisitingUser){
      return res.json({message: 'User Already Exists'})
    }else{
    const newUser = new User({ firstName,lastName,username, email, password });
    await newUser.save();
    res
      .status(201)
      .json({ message: "User registered successfully", user: newUser });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });

  }
});

router.post("/users", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username, password }); // Validate user credentials

    if (user) {
      req.session.user = user; // Store user data in the session
      res.status(200).json({ message: "Logged in successfully", loggedIn: true, user });
    } else {
      res.status(401).json({ message: "Invalid credentials", loggedIn: false });
    }
  } catch (error) {
    res.status(500).json({ error: "An error occurred" });
  }
});



router.get("/session", (req, res) => {
  console.log(req.session.user)
  if (req.session.user) {
    res.json({ loggedIn: true, user: req.session.user });
  } else {
    res.json({ loggedIn: false });
  }
});

router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Failed to log out" });
    }
    res.clearCookie("connect.sid"); // Clears the session cookie
    res.status(200).json({ message: "Logged out successfully" });
  });
});

router.post('/create', async (req, res) => {
  const { content } = req.body;
  const user = req.session.user;

  if (!user) {
    return res.status(401).json({ message: 'You must be logged in to post' });
  }

  try {
    const newPost = new Post({
      user: user._id, 
      content,
    });

    await newPost.save();
    res.status(201).json({ message: 'Post created successfully', post: newPost });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/feed', async (req, res) => {
  const user = req.session.user;

  if (!user) {
    return res.status(401).json({ message: 'You must be logged in to view posts' });
  }

  try {
    // Find all posts from the current user and users they follow
    const posts = await Post.find({
      user: { $in: [user._id, ...user.following] },  // Match current user and followed users
    })
      .populate('user', 'username') // Populate user data for each post
      .sort({ createdAt: -1 }); // Sort posts by date in descending order

    res.status(200).send(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.post('/deletePost', async (req, res) => {
  const { postId } = req.body; 

  try {
    const deletedPost = await Post.findByIdAndDelete(postId);

    if (deletedPost) {
      res.status(200).json({ message: 'Post deleted successfully' });
    } else {
      res.status(404).json({ message: 'Post not found' });
    }
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ message: 'Error deleting post', error });
  }
});

router.get("/search/users", async (req, res) => {
  try {
    const { query } = req.query; 
    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const users = await User.find({
      username: { $regex: query, $options: "i" }, 
    }).limit(10); 

    res.json(users); 
  } catch (error) {
    console.error("Error searching users", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id); 
    if (!user) return res.status(404).send({ message: "User not found" });
    res.status(200).send(user);
  } catch (error) {
    res.status(500).send({ message: "Error fetching user data" });
  }
});
router.get("/users/:userId/posts", async (req, res) => {
  const { userId } = req.params;
  try {
    const posts = await Post.find({ user: userId }).populate('user', 'username')
    res.json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ message: "Error fetching posts" });
  }
});
router.post("/users/:userId/follow", async (req, res) => {
  const userId = req.session.user._id; // Current user ID
  const targetUserId = req.params.userId; // User to follow/unfollow
  const { follow } = req.body;

  try {
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (follow) {
      currentUser.following.addToSet(targetUserId); // Follow user
    } else {
      currentUser.following.pull(targetUserId); // Unfollow user
    }
    const isFollowing = currentUser.following.includes(targetUserId);

    // Only save the fields that need to be updated (avoid unnecessary fields)
    await currentUser.save({ validateModifiedOnly: true }); // Save only modified fields

    res.status(200).json({ isFollowing: follow });
  } catch (error) {
    console.error("Error updating follow status", error.message, error.stack);
    res.status(500).json({ message: "Error updating follow status", error });
  }
});
router.get("/users/:userId/follow", async (req, res) => {
  const userId = req.session.user._id; // Current user ID
  const targetUserId = req.params.userId; // Target user to check follow status

  try {
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({ message: "Current user not found" });
    }

    // Check if the current user is following the target user
    const isFollowing = currentUser.following.includes(targetUserId);

    // Respond with the follow status
    res.status(200).json({ isFollowing });
  } catch (error) {
    console.error("Error checking follow status", error.message, error.stack);
    res.status(500).json({ message: "Error checking follow status", error });
  }
});

module.exports = router;
