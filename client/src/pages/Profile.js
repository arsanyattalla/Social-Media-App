import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import axios from "axios";
import apiURL from "../config";
import "../css/Profile.css";
import SearchBar from "../components/SearchBar";
import DeleteButton from "../components/DeletePost";
import { faBullseye } from "@fortawesome/free-solid-svg-icons";

function Profile() {
  const [userPosts, setUserPosts] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loggedin, setLoggedin] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [loggedinUserId, setLoggedinUserId] = useState(null)
  const [showFollowButton, setShowFollowButton] = useState(false)

  const searches  = useLocation();
  const queryParams = new URLSearchParams(searches.search);
  const userId = queryParams.get("id"); 
  console.log(userId)
  
  const checkSession = async () => {
    try {
        const response = await axios.get(apiURL+"/api/session", { withCredentials: true });
        console.log(response)
        if (response.data.user.id && response.data.loggedIn) {
          setLoggedinUserId(response.data.user.id)
          setLoggedin(true)
            //navigate(`/profile?id=${response.data.user.id}`);
        }
    } catch (error) {
        console.error("Session check failed:", error);
    }
};




  const handlePostDelete = (postId) => {
    if(loggedin){
      setShowDelete(true)
    setUserPosts((prevPosts) =>
      prevPosts.map((post) =>
        post._id === postId ? { ...post, deleting: true } : post
      )
    );
    setTimeout(() => {
      setUserPosts((prevPosts) =>
        prevPosts.filter((post) => post._id !== postId)
      );
    }, 500);}else{

    }
  };

  useEffect(() => {
    const fetchUserInfo = async () => {
      await checkSession()
      console.log(userId,loggedinUserId)
      if(userId === loggedinUserId){
        setShowFollowButton(true)
      }else{
        setShowFollowButton(false)
      }
      try {
        const [userResponse, postsResponse] = await Promise.all([
          axios.get(`${apiURL}/api/users/${userId}`),
          axios.get(`${apiURL}/api/users/${userId}/posts`, { withCredentials: true }),
      ]);
        console.log(postsResponse);

        setUserInfo(userResponse.data);
        setUserPosts(postsResponse.data.reverse());

      } catch (error) {
        console.error("Error fetching profile information", error);
      }
    };

    fetchUserInfo();
  }, [userId]);
  const handleFollowToggle = async () => {
   
 
    try {
      const response = await axios.post(
        `${apiURL}/api/users/${userId}/follow`,
        {
          follow: !isFollowing,
        },
        { withCredentials: true }
      );

      setIsFollowing(response.data.isFollowing);
      
    } catch (error) {
      console.error("Error toggling follow state", error);
    }
  
  };
  useEffect(() => {

    const getFollowStatus = async () => {
      await checkSession()

        try {
          const response = await axios.get(
            `${apiURL}/api/users/${userId}/follow`,
           
            { withCredentials: true }
          );
    
          setIsFollowing(response.data.isFollowing);
        } catch (error) {
          console.error("Error toggling follow state", error);
        }
      }

      getFollowStatus()
      }, []);
  if (!userInfo) {
    return <div className="loading-spinner"></div>;
  }


  

  return (
    <div className="profile-container">
      <SearchBar></SearchBar>

      <div className="profile-card">
        <div className="profile-header">
          <img
            className="profile-avatar"
            src={userInfo.avatar || "https://via.placeholder.com/150"}
            alt={`${userInfo.username}'s avatar`}
          />
          <h2 className="profile-username">{userInfo.username}</h2>
        </div>
        <div className="profile-body">
          <p className="profile-email">Email: {userInfo.email}</p>
          <p className="profile-date">
            Joined: {new Date(userInfo.createdAt).toLocaleDateString()}
          </p>
          <p className="profile-bio">{userInfo.bio || "No bio available"}</p>
          {loggedin && userId !== loggedinUserId && (
  <button
    className={`follow-button ${isFollowing ? "following" : ""}`}
    onClick={handleFollowToggle}
  >
    {isFollowing ? "Unfollow" : "Follow"}
  </button>
)}

        </div>
      </div>

      <div className="profile-posts">
        <h3>Posts</h3>
        {userPosts.length > 0 ? (
          <ul className="posts-list">
            {userPosts.map((post) => (
              <li key={post._id} className="post-item">
                <h4 className="post-title">{post.title}</h4>
                <p className="post-content">{post.content}</p>
                <p className="post-date">
                  Posted on: {new Date(post.createdAt).toLocaleDateString()}
                </p>
                {loggedinUserId === userId && 
                <DeleteButton
                  postId={post._id}
                  onDeleteSuccess={handlePostDelete}
                ></DeleteButton>
}
              </li>
            ))}
          </ul>
        ) : (
          <p className="no-posts">This user hasn't made any posts yet.</p>
        )}
      </div>
    </div>
  );
}

export default Profile;
