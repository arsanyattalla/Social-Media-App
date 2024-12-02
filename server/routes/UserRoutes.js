const express = require("express");
const User = require("../models/user");
const router = express.Router();
const Post = require("../models/post")
const Session = require("../models/session")
const bcrypt = require('bcrypt');
const saltRounds = 10;


router.post("/register", async (req, res) => {
  const {firstName,lastName, username, email, password } = req.body;
  console.log(req.body);


  try {
    const exisitingUser = await User.findOne({$or:[{username},{email}]})
    if(exisitingUser){
      return res.json({message: 'User Already Exists'})
    }else{
      const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = new User({ firstName,lastName,username, email, password: hashedPassword, following: [] 
    });
    newUser.following.push(newUser._id);

    await newUser.save();
    res
      .status(201)
      .json({ message: "User registered successfully", user: newUser });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });

  }
});

router.post('/users', async (req, res) => {
  try {
      const { username, password } = req.body;

      // Find the user by username
      const user = await User.findOne({ username });

      if (!user) {
          console.error("User not found");
          return res.status(401).json({ message: "User not found" });
      }

      if (user.password !== password) {
        console.error("Invalid credentials for user:", username);
        return res.status(401).json({ message: "Invalid credentials" });
    }
   // const isMatch = await bcrypt.compare(password, user.password);

    //if (!isMatch) {
    //    console.error("Invalid credentials for user:", username);
     //   return res.status(401).json({ message: "Invalid credentials" });
    //}


      // Clear the previous session if it exists
      req.session.regenerate((err) => {
          if (err) {
              console.error('Failed to regenerate session:', err);
              return res.status(500).json({ message: "Session regeneration failed" });
          }

          // Assign the user's ID to the new session
          req.session.user_id = user._id;

          if (!req.session.user_id) {
              console.error("Failed to assign user_id to session");
              return res.status(500).json({ message: "Session creation failed" });
          }

          console.log('Assigned user_id to session:', req.session.user_id);
          res.status(200).json({ user, message: "Login successful" });
      });
  } catch (err) {
      console.error('Error during login:', err);
      res.status(500).send('An error occurred');
  }
});




router.get("/session", (req, res) => {
  // Check if the user_id exists in the session
  if (req.session && req.session.user_id) {
    // Query the user by their ID stored in the session
    User.findById(req.session.user_id)
      .then(user => {
        if (!user) {
          // If the user is not found in the database, clear the session
          req.session.destroy((err) => {
            if (err) {
              return res.status(500).json({ message: "Failed to destroy session" });
            }
            return res.status(200).json({
              loggedIn: false,
              message: "User not found, session destroyed.",
            });
          });
        } else {
          // Return user information if found
          res.status(200).json({
            loggedIn: true,
            user: {
              id: user._id,
              username: user.username,
            },
          });
        }
      })
      .catch(err => {
        console.error("Error fetching user by ID:", err);
        res.status(500).json({ message: "Internal server error" });
      });
  } else {
    // If there's no user_id in the session
    res.status(200).json({
      loggedIn: false,
      message: "User is not logged in.",
    });
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
  const user = req.session.user_id;

  if (!user) {
    return res.status(401).json({ message: 'You must be logged in to post' });
  }

  try {
    const newPost = new Post({
      user, 
      content,
    });

    await newPost.save();
    res.status(201).json({ message: 'Post created successfully', post: newPost });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/feed', async (req, res) => {
  const userId = req.session.user_id; // Extract the user ID from the session
  console.log("User ID from session:", userId);

  if (!userId) {
    return res.status(401).json({ message: 'You must be logged in to view posts' });
  }

  try {
    // Fetch the current user's following list
    const currentUser = await User.findById(userId).select('following');
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log("Current user's following:", currentUser.following);

    // Fetch all posts
    const allPosts = await Post.find({})
      .populate('user', 'username') // Only populate username for now
      .sort({ createdAt: -1 })
      .lean();

    console.log("All posts fetched:", allPosts.length);

    // Retrieve the `following` list for each post owner
    const filteredPosts = [];
    for (const post of allPosts) {
      if (!post.user) {
        console.warn(`Post has no associated user. Skipping post ID: ${post._id}`);
        continue;
      }

      const postOwner = await User.findById(post.user._id).select('following');
      if (!postOwner) {
        console.warn(`User for post ID ${post._id} not found. Skipping.`);
        continue;
      }

      const isMutual =
        currentUser.following.includes(post.user._id.toString()) && // Current user follows the post owner
        postOwner.following.includes(userId); // Post owner follows the current user

      if (isMutual) {
        filteredPosts.push(post);
      } else {
        console.log(`Post by user ${post.user.username} is not mutual, skipping.`);
      }
    }

    console.log("Filtered posts:", filteredPosts.length);

    res.status(200).send(filteredPosts);
  } catch (err) {
    console.error("Error fetching posts:", err);
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
  const currentUser = req.session.user_id;

  if (!currentUser) {
    return res.status(401).json({ message: "User not authenticated" });
  }

  try {
    // Fetch the current user and the target user
    const currentUserData = await User.findById(currentUser);
    const targetUserData = await User.findById(userId);

    if (!currentUserData || !targetUserData) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the current user is following userId and vice versa
    const isFollowing = currentUserData.following.includes(userId);
    const isFollowedBack = targetUserData.following.includes(currentUser);

    if (isFollowing && isFollowedBack) {
      // Fetch and return posts if conditions are met
      const posts = await Post.find({ user: userId }).populate('user', 'username');
      return res.json(posts);
    } else {
      return res.status(200).json({ message: "You are not mutual followers with this user" });
    }
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ message: "Error fetching posts" });
  }
});
router.post("/users/:userId/follow", async (req, res) => {
  const userId = req.session.user_id; // Current user ID
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
  const userId = req.session.user_id; // Current user ID
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

router.post("/like", async (req, res) => {
  try {
    const userId = req.session.user_id; // Assuming user_id is stored in the session
    const { postId } = req.body; // Post ID sent in the request body

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized. Please log in.' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    const userAlreadyLiked = post.likes.users.includes(userId);

    if (userAlreadyLiked) {
      // User already liked the post, so unlike it
      post.likes.users = post.likes.users.filter(
        (id) => id.toString() !== userId.toString()
      );
      post.likes.count -= 1;
      await post.save();
      return res.status(200).json({
        message: 'Post unliked successfully.',
        likesCount: post.likes.count,
      });
    } else {
      // User has not liked the post, so add like
      post.likes.users.push(userId);
      post.likes.count += 1;
      await post.save();
      return res.status(200).json({
        message: 'Post liked successfully.',
        likesCount: post.likes.count,
      });
    }
  } catch (error) {
    console.error('Error liking post:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});


router.get('/likes/:postId', async (req, res) => {
  try {
    const { postId } = req.params;

    // Find the post by ID and populate the users in the likes.users array
    const post = await Post.findById(postId).populate('likes.users', 'username');
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Extract usernames from the populated users array
    const usernames = post.likes.users.map((user) => user.username);

    res.status(200).json({
      likesCount: post.likes.count, // The count from the schema
      usernames, // Array of usernames who liked the post
    });
  } catch (error) {
    console.error('Error fetching likes:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});


module.exports = router;
