import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import PostForm from "./PostForm";
import "../css/Feed.css";
import apiURL from "../config";
import Delete from "../components/DeletePost";
import SearchBar from "../components/SearchBar";
import { useLocation } from "react-router-dom";

function Feed() {
  const navigate = useNavigate();
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [delayedMessage, setDelayedMessage] = useState(false); // Track delayed message
  const [loggedinUserId, setLoggedinUserId] = useState(null);
  const [postsVisible, setPostsVisible] = useState(false);

  const fetchLikes = useCallback(async () => {
    try {
      const updatedPosts = await Promise.all(
        posts.map(async (post) => {
          const response = await axios.get(`${apiURL}/api/likes/${post._id}`, {
            withCredentials: true,
          });
          return {
            ...post,
            likesCount: response.data.likesCount,
            likedBy: response.data.usernames,
          };
        })
      );
      setPosts(updatedPosts);
    } catch (error) {
      console.error("Error fetching likes for posts:", error);
    }
  }, [posts]);

  const handleLikeButton = async (postId) => {
    try {
      const response = await axios.post(
        apiURL + "/api/like",
        { postId },
        { withCredentials: true }
      );
      console.log(response.data);
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post._id === postId
            ? { ...post, likesCount: response.data.likesCount } // Assuming backend returns updated `likesCount`
            : post
        )
      );
    } catch (error) {
      console.error("Error toggling like:", error.response.data.message);
    }
  };
  useEffect(() => {
    if (posts.length > 0) {
      setPostsVisible(true);
    }
  }, [posts]);
  const searches = useLocation();
  const queryParams = new URLSearchParams(searches.search);
  const id = queryParams.get("id");

  const checkSession = useCallback(async () => {
    try {
      const response = await axios.get(apiURL + "/api/session", {
        withCredentials: true,
      });
      console.log(response);
      setLoggedIn(response.data.loggedIn);
      setLoggedinUserId(response.data.user.id);
      if (response.data.loggedIn) {
        setUsername(response.data.user.username);
      }
    } catch (error) {
      setLoggedIn(false);
      console.error("Session check failed:", error);
    } finally {
      setLoading(false);
      console.log(loggedIn);
    }
  }, []);

  const fetchPosts = useCallback(async () => {
    if (loggedIn) {
      try {
        const response = await axios.get(`${apiURL}/api/feed`, {
          params: { id },
          withCredentials: true,
        });
        setPosts(response.data);
      } catch (error) {
        console.error("Error fetching posts:", error);
      }
    }
  }, [loggedIn]);
  useEffect(() => {
    if (posts.length > 0) {
      fetchLikes();
    }
  }, [posts, fetchLikes]);
  const handlePostCreated = async (newPost) => {
    try {
      setPosts([newPost, ...posts]);
      const response = await axios.get(`${apiURL}/api/feed`, {
        params: { id },
        withCredentials: true,
      });
      setPosts(response.data);
    } catch (error) {
      console.error("Error fetching posts after creating new post", error);
    }
  };

  // Handle post deletion
  const handlePostDelete = (postId) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post._id === postId ? { ...post, deleting: true } : post
      )
    );
    setTimeout(() => {
      setPosts((prevPosts) => prevPosts.filter((post) => post._id !== postId));
    }, 500);
  };

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    if (loggedIn) {
      fetchPosts();
    }
  }, [loggedIn, fetchPosts]);

  useEffect(() => {
    // Set a delay before showing "No Posts" message
    const timeoutId = setTimeout(() => {
      setDelayedMessage(true);
    }, 2000);

    return () => clearTimeout(timeoutId); // Clean up timeout on unmount
  }, [posts]);

  if (loading) {
    return <div className="loading-spinner"></div>;
  }

  if (!loggedIn) {
    setTimeout(() => {
      navigate("/");
    }, 5000);
  }

  return (
    <div className="feed-container">
      {loggedIn ? (
        <>
          <h2 className="title">Welcome to your Dashboard, {username}!</h2>
          <div className="title2-container">
            <SearchBar className="title2" />
          </div>

          <PostForm onPostCreated={handlePostCreated} />
          <div className="feed-content">
            {posts.length === 0 && !delayedMessage ? (
              <div className="loading-spinner"></div>
            ) : !loading && posts.length === 0 && delayedMessage ? (
              <p className="title1">No Posts</p>
            ) : (
              posts.map((post, index) => (
                <div
                  key={post._id}
                  className={`post ${post.deleting ? "fade-out" : ""} ${
                    postsVisible ? "slide-in" : ""
                  }`}
                  style={{ animationDelay: `${index * 0.1}s` }} // Stagger animation
                >
                  <div className="post-header">
                    <h3>@{post.user.username}</h3>
                    <span className="post-date">
                      {new Date(post.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="post-text">{post.content}</p>
                  <div className="post-footer">
                  {post.likedBy && post.likedBy.length > 0 && (
                      <div className="likes-tooltip">
                        Liked by: {post.likedBy.join(", ")}
                      </div>
                    )}
                    <button
                      className="like-button"
                      onClick={() => handleLikeButton(post._id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      <div>
                      {post.likesCount > 0 ? post.likesCount : null}
                      </div>
                      👍 
                    </button>
                    
                    <div className="comment">
                      <button className="comment-button">💬</button>
                    </div>
                    {loggedinUserId === post.user._id && (
                      <Delete
                        postId={post._id}
                        onDeleteSuccess={handlePostDelete}
                      />
                    )}
                    
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <h1 style={{ color: "white" }}>
          Please log in...redirecting to Login page...
        </h1>
      )}
    </div>
  );
}

export default Feed;
