import React from "react";
import { Routes, Route } from "react-router-dom";
import CountryHome from "./pages/CountryHome";
import Login from "./pages/Login";
import Signup from "./pages/SignUp";
import FavoritesPage from "./pages/Favorites";

function App() {
  return (
    <Routes>
      <Route path="/home" element={<CountryHome />} />
      <Route path="/" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/favorites" element={<FavoritesPage />} />
    </Routes>
  );
}

export default App;
