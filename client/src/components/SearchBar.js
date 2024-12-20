import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faSignOutAlt, faHome, faUser } from "@fortawesome/free-solid-svg-icons";
import { useNavigate, useParams, useLocation} from "react-router-dom";
import "../../src/css/SearchBar.css";
import apiURL from "../config";
import image from '../components/Untitleddesign.png'
import { checkboxClasses } from "@mui/material";
function SearchBar() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState(false);
  const [username,setUsername] = useState(null)
  const searchRef = useRef(null);
  const [profile,setProfile] = useState(false)
  const navigate = useNavigate();
  const handleUserClick = (userId) => {

    navigate(`/profile?id=${userId}`);
};
  
  const handleSearchChange = async (e) => {
    const searchQuery = e.target.value;
    setQuery(searchQuery);

    if (searchQuery.trim() === "") {
      setUsers([]);
      setSearch(false);
      return;
    }

    try {
      const response = await axios.get(apiURL+`/api/search/users`, {
        params: { query: searchQuery },
      });
      setUsers(response.data);
      setSearch(true);
    } catch (error) {
      console.error("Error fetching search results", error);
    }
  };

  const handleClickOutside = (e) => {
    if (searchRef.current && !searchRef.current.contains(e.target)) {
      setSearch(false);
    }
  };

  const handleProfileClick= async ()=>{
    setProfile(true)
    await checkSession()
  }

  const handleLogout = async () => {
    try {
      const response = await axios.post(apiURL+"/api/logout", {}, { withCredentials: true });
      if (response.status === 200) {
        alert(response.data.message);
        navigate("/");
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };
  const checkSession = async () => {
    try {
        const response = await axios.get(apiURL+"/api/session", { withCredentials: true });
        if (response.data.user.id) {
            if(profile){
            navigate(`/profile?id=${response.data.user.id}`);
            setProfile(false)
            }
            console.log(response.data.user)
            setUsername(response.data.user.username)
        }
    } catch (error) {
        console.error("Session check failed:", error);
    }
};
  useEffect(() => {
    checkSession()
    if (search) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [search]);

  return (
    <div className="navbar" ref={searchRef}>
      {/* Home Icon */}
      <div className="icon" onClick={() => navigate(`/feed`)}>
        <img src={image} />
      </div>

      {/* Search Input */}
      <div className="search-container">
        <input
          className="search-input"
          placeholder="Search"
          value={query}
          onChange={handleSearchChange}
          onClick={() => setSearch(true)}
        />
        <FontAwesomeIcon icon={faSearch} className="search-icon" />
      </div>

      {/* Profile Icon */}
      <div className="icon" onClick={() => handleProfileClick()}>
        <FontAwesomeIcon icon={faUser} />
        <p>{username}</p>
      </div>

      {/* Logout Icon */}
      <div className="icon" onClick={handleLogout}>
        <FontAwesomeIcon icon={faSignOutAlt} />
      </div>

      {/* Search Results Dropdown */}
      {users.length > 0 && search && (
        <div className="search-results">
          {users.map((user) => (
            <div key={user._id} className="user-item" onClick={() => handleUserClick(user._id)}>
              <span>{user.username}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SearchBar;
