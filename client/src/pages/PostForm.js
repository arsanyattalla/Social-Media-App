import { useState } from 'react';
import axios from 'axios';
import "../css/PostForm.css"; 
import apiURL from "../config"
import post from '../components/paper-plane.png'

function PostForm({ onPostCreated }) {
  const [content, setContent] = useState('');

  const handlePostChange = (e) => {
    setContent(e.target.value);
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(apiURL+'/api/create', { content }, { withCredentials: true });
      if (response.status === 201 || 200) {
        onPostCreated(response.data.post);  
        setContent(''); 
      }
    } catch (error) {
      console.error("Error creating post", error);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {  
      e.preventDefault();  
      handlePostSubmit(e);  
    }
  };

  return (
    <form onSubmit={handlePostSubmit} className="post-form">
    <div className="textarea-wrapper">
      <textarea
        value={content}
        onChange={handlePostChange}
        onKeyDown={handleKeyDown}  
        placeholder="What's on your mind?"
        required
        className="post-textarea"
      />
      <button type="submit" className="post-button">
        <img src={post} alt="Submit Post" />
      </button>
    </div>
  </form>
  );
}

export default PostForm;
