import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import CountryModal from "../components/CountryModal";
import { FaArrowUp } from "react-icons/fa";
import "animate.css";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import { getAuth } from "firebase/auth";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import "react-toastify/dist/ReactToastify.css";

const CountryHome = () => {
    const [countries, setCountries] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [regionFilter, setRegionFilter] = useState("All");
    const [loading, setLoading] = useState(false);
    const [selectedCountry, setSelectedCountry] = useState(null);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [favorites, setFavorites] = useState([]);
    const [favoriteLoading, setFavoriteLoading] = useState(false);
    const countryRefs = useRef([]);
    const auth = getAuth();

    useEffect(() => {
        fetchCountries();
        loadFavorites();
    }, [regionFilter]);

    useEffect(() => {
        const handleScroll = () => {
            setShowScrollButton(window.scrollY > 200);

            countryRefs.current.forEach((ref) => {
                if (ref) {
                    const rect = ref.getBoundingClientRect();
                    const isVisible = rect.top <= window.innerHeight * 0.8;
                    if (isVisible) {
                        ref.classList.add('animate__animated', 'animate__fadeIn');
                    }
                }
            });
        };

        window.addEventListener('scroll', handleScroll);
        handleScroll();

        return () => window.removeEventListener('scroll', handleScroll);
    }, [countries]);

    const loadFavorites = async () => {
        const user = auth.currentUser;
        if (user) {
            try {
                const docRef = doc(db, "userFavorites", user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setFavorites(docSnap.data().favorites || []);
                }
            } catch (error) {
                console.error("Error loading favorites:", error);
            }
        }
    };

    const addToFavorites = async (country) => {
        const user = auth.currentUser;
        if (!user) {
            toast.error("Please login to save favorites");
            return;
        }

        try {
            setFavoriteLoading(true);
            const countryId = country.cca3;
            if (favorites.includes(countryId)) {
                // Show SweetAlert confirmation to remove
                const result = await Swal.fire({
                    title: `Remove ${country.name.common}?`,
                    text: "Do you want to remove this from favorites?",
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonText: "Yes, remove it!",
                    cancelButtonText: "Cancel",
                });

                if (result.isConfirmed) {
                    await removeFromFavorites(countryId);
                    toast.success(`${country.name.common} removed from favorites`);
                }
                return;
            }

            const updatedFavorites = [...favorites, countryId];
            await setDoc(doc(db, "userFavorites", user.uid), {
                favorites: updatedFavorites,
                lastUpdated: new Date(),
                userEmail: user.email
            });

            setFavorites(updatedFavorites);
            toast.success(`${country.name.common} added to favorites`);
        } catch (error) {
            console.error("Error updating favorites:", error);
            toast.error("Failed to update favorites");
        } finally {
            setFavoriteLoading(false);
        }
    };

    const removeFromFavorites = async (countryId) => {
        const user = auth.currentUser;
        if (!user) return;

        const updatedFavorites = favorites.filter(id => id !== countryId);
        await setDoc(doc(db, "userFavorites", user.uid), {
            favorites: updatedFavorites,
            lastUpdated: new Date(),
            userEmail: user.email
        });

        setFavorites(updatedFavorites);
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const fetchCountries = async () => {
        setLoading(true);
        let url = "https://restcountries.com/v3.1/all";
        if (regionFilter !== "All") {
            url = `https://restcountries.com/v3.1/region/${regionFilter.toLowerCase()}`;
        }
        try {
            const res = await axios.get(url);
            setCountries(res.data);
        } catch (err) {
            console.error("Error fetching countries", err);
        } finally {
            setLoading(false);
        }
    };

    const searchCountries = async (name) => {
        setLoading(true);
        try {
            const res = await axios.get(`https://restcountries.com/v3.1/name/${name}`);
            setCountries(res.data);
        } catch (err) {
            console.error("Error searching country", err);
            setCountries([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        if (value.trim()) {
            searchCountries(value);
        } else {
            fetchCountries();
        }
    };

    return (
        <div className={`${darkMode ? "bg-dark text-light" : "bg-light text-dark"} min-vh-100`}>
            <Navbar />

            <div className="container py-5">
                <div className="row justify-content-center mb-4">
                    <div className="col-md-4 mb-3">
                        <input
                            type="text"
                            className="form-control form-control-lg shadow-sm"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                        />
                    </div>
                    <div className="col-md-4 mb-3">
                        <select
                            className="form-select form-select-lg shadow-sm"
                            value={regionFilter}
                            onChange={(e) => setRegionFilter(e.target.value)}
                        >
                            <option value="All">All Regions</option>
                            <option value="Africa">Africa</option>
                            <option value="Americas">Americas</option>
                            <option value="Asia">Asia</option>
                            <option value="Europe">Europe</option>
                            <option value="Oceania">Oceania</option>
                        </select>
                    </div>
                </div>

                {loading && (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status"></div>
                    </div>
                )}

                <div className="row row-cols-1 row-cols-md-3 g-4">
                    {countries.map((country, index) => (
                        <div
                            className="col"
                            key={country.cca3}
                            ref={el => countryRefs.current[index] = el}
                            style={{ opacity: 0 }}
                        >
                            <div
                                className="card h-100 shadow border-0 hover-scale"
                                onClick={() => setSelectedCountry(country)}
                                style={{
                                    transition: 'transform 0.3s ease',
                                    cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
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
                                        className="btn btn-outline-primary btn-sm mt-2 me-2"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedCountry(country);
                                        }}
                                    >
                                        View More Details
                                    </button>
                                    <button
                                        className={`btn btn-sm mt-2 ${favorites.includes(country.cca3) ? "btn-success" : "btn-warning"}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            addToFavorites(country);
                                        }}
                                        disabled={favoriteLoading}
                                    >
                                        {favorites.includes(country.cca3) ? "Added" : "Add to Favorites"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <CountryModal
                show={!!selectedCountry}
                country={selectedCountry}
                onClose={() => setSelectedCountry(null)}
                favorites={favorites}
                toggleFavorite={addToFavorites}
            />

            {showScrollButton && (
                <button
                    onClick={scrollToTop}
                    className="btn btn-primary position-fixed animate__animated animate__fadeIn"
                    style={{
                        bottom: "20px",
                        right: "20px",
                        borderRadius: "40%",
                        padding: "10px 12px",
                        zIndex: 9999,
                        boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
                        backgroundColor: "#02092e"
                    }}
                    aria-label="Scroll to top"
                >
                    <FaArrowUp size={20} />
                </button>
            )}

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

export default CountryHome;
