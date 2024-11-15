import apiURL from "../config"
import React from "react";
import axios from "axios";
function Delete({postId,onDeleteSuccess}){
   
    const handleDelete = async () => {
        try {
          const response = await axios.post(
            `${apiURL}/api/deletePost`,
            { postId },  
            { withCredentials: true }
          );
          
          if (response.status === 200) {
            onDeleteSuccess(postId);  
          }
        } catch (error) {
          console.error("Error deleting post", error);
        }
      };

      return (
        <button className="delete-button" onClick={handleDelete}>
          🗑️
        </button>
      );
    }


export default Delete;