import React, { useState, useEffect } from "react";
import "../css/App.css";
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import apiURL from "../config"



function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [userId,setUserId]= useState("")
    let user = ''
    const navigate = useNavigate();
   
    const fetchUser = async (e) => {
        e.preventDefault();  

        try {
            const response = await axios.post(apiURL+"/api/users", {
                username,
                password,
            }, { withCredentials: true });

            if (response.status === 200) {
                alert(response.data.message);
                user = response.data.user._id
                setUserId(response.data.user)
                navigate(`/feed?id=${response.data.user._id}`);
            }
        } catch (error) {
            console.error("Error fetching user", error.response ? error.response.data : error);
            alert("Invalid credentials. Please try again.");
        }
    };

    const checkSession = async () => {
        try {
            const response = await axios.get(apiURL+"/api/session", { withCredentials: true });
            if (response.data.loggedIn) {

                navigate(`/feed?id=${response.data.user._id}`);
            }
        } catch (error) {
            console.error("Session check failed:", error);
        }
    };

    useEffect(() => {
        console.log('hi')
        checkSession(); 
    },[]);

    return (
        <div className="login-page">
            <div className="login-box">
                <h1 className="logo">Momentia</h1>
                <form className="login-form" onSubmit={fetchUser}>
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button type="submit">Log In</button>
                </form>
            </div>
            <div className="signup-box">
                <p>
                    Don't have an account? <a href="/register">Sign up</a>
                </p>
            </div>
        </div>
    );
}

export default Login;
