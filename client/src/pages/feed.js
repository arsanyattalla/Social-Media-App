import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import PostForm from "./PostForm";
import "../css/Feed.css";
import apiURL from "../config";
import Delete from "../components/DeletePost";
import SearchBar from "../components/SearchBar";
import { useParams, useLocation } from "react-router-dom";
function Feed() {
  const navigate = useNavigate();
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const searches  = useLocation();
  const queryParams = new URLSearchParams(searches.search);
  const id = queryParams.get("id"); 
  // Check session status
  const checkSession = useCallback(async () => {
    
    try {
      const response = await axios.get(apiURL + "/api/session", {
        withCredentials: true,
      });
      setLoggedIn(response.data.loggedIn);
      if (response.data.loggedIn) {
        setUsername(response.data.user.username);
      }
    } catch (error) {
      setLoggedIn(false);
      console.error("Session check failed:", error);
    } finally {
      setLoading(false);
      console.log(loggedIn) 
      
    
  }
  }, []);

  const fetchPosts = useCallback(async () => {
    if (loggedIn) {
      try {
        const response = await axios.get(`${apiURL}/api/feed?id=${id}`, {
          
          withCredentials: true,
        });
        setPosts(response.data);
      } catch (error) {
        console.error("Error fetching posts:", error);
      }
    }
  }, [loggedIn]);

 

  const handlePostCreated = async (newPost) => {
    try {
      setPosts([newPost, ...posts]);
      const response = await axios.get(apiURL + "/api/feed", {
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

  if (loading) {
    return <div className="loading-spinner"></div>;
  }
  if(!loggedIn){
    setTimeout(()=>{
      navigate("/");

    },5000)
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
            {!loading && posts.length === 0 && (
              <p className="title1">No Posts</p>
            )}
            {posts.map((post) => (
                <div key={post._id} className={`post ${post.deleting ? "fade-out" : ""}`}>
                <div className="post-header">
                  <h3>@{post.user.username}</h3>
                  <span className="post-date">{new Date(post.createdAt).toLocaleString()}</span>
                </div>
                <p className="post-text">{post.content}</p>
                <div className="post-footer">
                  <button className="like-button">👍</button>
                  <button className="comment-button">💬</button>
                  <Delete postId={post._id} onDeleteSuccess={handlePostDelete} />
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <h1 style={{ color: "white" }}>Please log in...redirecting to Login page...</h1>
      )}
    </div>
  );
}

export default Feed;
