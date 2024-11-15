import React, { useState } from "react";
import "../css/App.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import apiURL from "../config"

function Register() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [emailError, setEmailError] = useState("");

  const Navigate = useNavigate();

  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  const handleEmail = (e) => {
    const enteredEmail = e.target.value;

    setEmail(enteredEmail);

    if (enteredEmail === "") {
      setEmailError("");
      return;
    }
    if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email address.");
      return;
    } else setEmailError("");
  };

  const registerUser = async (e) => {
    e.preventDefault();  

    try {
      const response = await axios.post(apiURL+"/api/register", {
        firstName,
        lastName,
        username,
        email,
        password,
      });
      console.log(response.data);
      if (response.status === 201 || 200) {
        alert(response.data.message);
        Navigate("/");
      }
    } catch (error) {
      console.error("Error registering user", error);
      if (error.message === "Request failed with status code 400") {
        alert("Username Already Exists");
      }else if (error.message === "Request failed with status code 500") {
        alert("Error");
      }
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <h1 className="logo">Momentia </h1>
        <form className="login-form" onSubmit={registerUser}>
        <input
            type="text"
            placeholder="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={handleEmail}
          />
          {emailError && <p style={{ color: "red" }}>{emailError}</p>}

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={registerUser} type="submit">
            Sign Up
          </button>
        </form>
      </div>
      <div className="signup-box">
        <p>
          Already have an account? <a href="/">Log In</a>
        </p>
      </div>
    </div>
  );
}

export default Register;
