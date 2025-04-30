import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import "../styles/Login.css";
import CryptoJS from "crypto-js";

const SignUp = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Generate a secure salt and hash the password
  const hashPassword = (password) => {
    const salt = CryptoJS.lib.WordArray.random(128/8).toString();
    const iterations = 10000;
    const keySize = 256;
    const hashedPassword = CryptoJS.PBKDF2(password, salt, {
      keySize: keySize/32,
      iterations: iterations
    }).toString();
    
    return {
      salt: salt,
      hash: hashedPassword,
      iterations: iterations,
      keySize: keySize
    };
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    try {
      setLoading(true);
      
      // Hash the password with salt
      const { salt, hash, iterations, keySize } = hashPassword(password);
      
      // Store user data in Firestore
      await addDoc(collection(db, "users"), {
        name: name,
        email: email.toLowerCase().trim(),
        password: {
          hash: hash,
          salt: salt,
          iterations: iterations,
          keySize: keySize
        },
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp()
      });

      navigate("/");
      
    } catch (err) {
      if (err.code === "permission-denied") {
        setError("Database write failed. Please contact support.");
      } else {
        setError("Failed to create account. Please try again.");
      }
      console.error("Signup error:", err);
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
          <h1>Create an account</h1>
          <p>Join us today!</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSignUp} className="login-form">
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength="2"
            />
          </div>

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
            <label>Password (min 8 characters)</label>
            <input
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength="8"
              required
            />
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength="8"
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
            {loading ? (
              <>
                <span className="spinner"></span> Creating account...
              </>
            ) : (
              "Sign Up"
            )}
          </motion.button>
        </form>

        <div className="signup-link">
          Already have an account?{" "}
          <button 
            onClick={() => navigate("/login")}
            className="text-link"
          >
            Login
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default SignUp;