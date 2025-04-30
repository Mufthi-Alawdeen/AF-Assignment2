import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import "../styles/Login.css";
import CryptoJS from "crypto-js";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const verifyPassword = (enteredPassword, storedHash, storedSalt, iterations, keySize) => {
    const hashedPassword = CryptoJS.PBKDF2(enteredPassword, storedSalt, {
      keySize: keySize/32,
      iterations: iterations
    }).toString();
    return hashedPassword === storedHash;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      
      // Query Firestore for user
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email.toLowerCase().trim()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error("No account found with this email");
      }

      // Get user data
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      
      // Verify password
      const isPasswordValid = verifyPassword(
        password,
        userData.password.hash,
        userData.password.salt,
        userData.password.iterations,
        userData.password.keySize
      );

      if (!isPasswordValid) {
        throw new Error("Incorrect password");
      }

      // Create session object
      const sessionData = {
        isAuthenticated: true,
        userId: userDoc.id,
        email: userData.email,
        name: userData.name,
        lastLogin: new Date().toISOString()
      };

      // Save to localStorage
      localStorage.setItem("userSession", JSON.stringify(sessionData));
      
      // Redirect to home
      navigate("/home");
      
    } catch (err) {
      switch (err.message) {
        case "No account found with this email":
          setError("No account found with this email");
          break;
        case "Incorrect password":
          setError("Incorrect password");
          break;
        default:
          setError("Failed to login. Please try again.");
          console.error("Login error:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="login-card"
      >
        <div className="login-header">
          <h1>Welcome back</h1>
          <p>Sign in to your account</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Continue"}
          </motion.button>
        </form>

        <div className="signup-link">
          Don't have an account?{" "}
          <button 
            onClick={() => navigate("/signup")}
            className="text-link"
          >
            Sign up
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;