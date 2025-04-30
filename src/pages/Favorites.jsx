import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaTrash, FaSignOutAlt } from "react-icons/fa";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import { getAuth } from "firebase/auth";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import "animate.css";
import Swal from "sweetalert2";

const FavoritesPage = () => {
    const [favoriteCountries, setFavoriteCountries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [darkMode, setDarkMode] = useState(false);
    const auth = getAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchFavoriteCountries = async () => {
            const user = auth.currentUser;
            if (!user) {
                navigate("/login");
                return;
            }

            try {
                const docRef = doc(db, "userFavorites", user.uid);
                const docSnap = await getDoc(docRef);
                
                if (docSnap.exists() && docSnap.data().favorites?.length > 0) {
                    const favoriteIds = docSnap.data().favorites;
                    
                    const responses = await Promise.all(
                        favoriteIds.map(id => 
                            axios.get(`https://restcountries.com/v3.1/alpha/${id}`)
                                .then(res => res.data[0])
                                .catch(() => null)
                        )
                    );
                    
                    const validCountries = responses.filter(country => country !== null);
                    setFavoriteCountries(validCountries);
                }
            } catch (error) {
                console.error("Error fetching favorites:", error);
                toast.error("Failed to load favorites");
            } finally {
                setLoading(false);
            }
        };

        fetchFavoriteCountries();
    }, [auth.currentUser, navigate]);

    const handleLogout = () => {
        Swal.fire({
            title: 'Are you sure?',
            text: "You will be logged out of your account",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, logout!'
        }).then((result) => {
            if (result.isConfirmed) {
                localStorage.removeItem('userSession');
                navigate('/');
                toast.success('Logged out successfully');
            }
        });
    };

    const removeFromFavorites = async (countryId, countryName) => {
        const result = await Swal.fire({
            title: `Remove ${countryName}?`,
            text: "This will remove the country from your favorites",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, remove it!'
        });

        if (result.isConfirmed) {
            const user = auth.currentUser;
            if (!user) return;

            try {
                const docRef = doc(db, "userFavorites", user.uid);
                const docSnap = await getDoc(docRef);
                
                if (docSnap.exists()) {
                    const currentFavorites = docSnap.data().favorites || [];
                    const updatedFavorites = currentFavorites.filter(id => id !== countryId);
                    
                    await setDoc(docRef, {
                        favorites: updatedFavorites,
                        lastUpdated: new Date(),
                        userEmail: user.email
                    });

                    setFavoriteCountries(prev => prev.filter(country => country.cca3 !== countryId));
                    toast.success(`${countryName} removed from favorites`);
                }
            } catch (error) {
                console.error("Error removing favorite:", error);
                toast.error("Failed to remove favorite");
            }
        }
    };

    if (loading) {
        return (
            <div className={`${darkMode ? "bg-dark text-light" : "bg-light text-dark"} min-vh-100 d-flex justify-content-center align-items-center`}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
      <div className={`${darkMode ? "bg-dark text-light" : "bg-light text-dark"} min-vh-100`}>
      <div className="container py-5">
          {/* Modified header section */}
          <div className="d-flex justify-content-between align-items-center mb-5">
              <h1 className="animate__animated animate__fadeIn m-0">Your Favorite Countries</h1>
              <button 
                  className="btn btn-outline-secondary"
                  onClick={handleLogout}
              >
                  <FaSignOutAlt /> Logout
              </button>
          </div>
          <hr/>
                
                {favoriteCountries.length === 0 ? (
                    <div className="text-center py-5">
                        <h3>No favorites yet!</h3>
                        <p>Add countries to your favorites from the home page</p>
                        <button 
                            className="btn btn-primary mt-3"
                            onClick={() => navigate("/home")}
                        >
                            Browse Countries
                        </button>
                    </div>
                ) : (
                    <div className="row row-cols-1 row-cols-md-3 g-4">
                        {favoriteCountries.map((country) => (
                            <div className="col animate__animated animate__fadeIn" key={country.cca3}>
                                <div className="card h-100 shadow border-0 hover-scale"
                                    style={{
                                        transition: 'transform 0.3s ease',
                                        cursor: 'pointer'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    <div className="position-relative">
                                        <img
                                            src={country.flags?.png}
                                            alt={country.name?.common}
                                            className="card-img-top rounded-top"
                                            style={{
                                                height: "180px",
                                                objectFit: "cover",
                                                borderBottom: "5px solid #f1f1f1"
                                            }}
                                        />
                                        <button
                                            className="position-absolute top-0 end-0 m-2 btn btn-danger btn-sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeFromFavorites(country.cca3, country.name.common);
                                            }}
                                            aria-label="Remove from favorites"
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                    <div className="card-body">
                                        <h5 className="card-title fw-semibold mb-2">
                                            {country.name?.common}
                                        </h5>
                                        <ul className="list-unstyled small text-muted mb-2">
                                            <li><strong>Population:</strong> {country.population?.toLocaleString()}</li>
                                            <li><strong>Region:</strong> {country.region}</li>
                                            <li><strong>Capital:</strong> {country.capital?.[0] || "N/A"}</li>
                                            <li><strong>Languages:</strong> {country.languages ? Object.values(country.languages).join(", ") : "N/A"}</li>
                                        </ul>
                                        <button
                                            className="btn btn-outline-primary btn-sm mt-2"
                                            onClick={() => navigate(`/country/${country.cca3}`)}
                                        >
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Dark Mode Toggle */}
            <button
                onClick={() => setDarkMode(prev => !prev)}
                className="btn btn-secondary position-fixed animate__animated animate__fadeIn"
                style={{
                    bottom: "30px",
                    left: "20px",
                    borderRadius: "40%",
                    padding: "10px 15px",
                    zIndex: 9999,
                    boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
                    backgroundColor: "#02092e"
                }}
                aria-label="Toggle dark/light mode"
            >
                {darkMode ? "⏾" : "☼"}
            </button>
        </div>
    );
};

export default FavoritesPage;