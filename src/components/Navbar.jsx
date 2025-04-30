import React from 'react';
import { FaHeart, FaSignOutAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

export default function Navbar() {
    const navigate = useNavigate();

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
                Swal.fire(
                    'Logged out!',
                    'You have been successfully logged out.',
                    'success'
                );
            }
        });
    };

    const handleFavoritesClick = () => {
        const userSession = localStorage.getItem('userSession');
        if (!userSession) {
            Swal.fire({
                title: 'Login Required',
                text: 'Please login to view your favorites',
                icon: 'info',
                confirmButtonText: 'Go to Login'
            }).then((result) => {
                if (result.isConfirmed) {
                    navigate('/login');
                }
            });
            return;
        }
        navigate('/favorites');
    };

    return (
        <nav 
            className="navbar navbar-expand-lg navbar-light shadow py-3 position-relative"
            style={{ backgroundColor: '#fff' }}
        >
            <div className="container-fluid">
                {/* Centered title - absolute positioning */}
                <a className="navbar-brand fw-bold fs-4 text-dark position-absolute start-50 translate-middle-x" href="#">
                    Country Flags Explorer
                </a>
                
                {/* Right-aligned buttons - pushed to end */}
                <div className="d-flex ms-auto">
                    <button 
                        className="btn btn-outline-danger me-2"
                        onClick={handleFavoritesClick}
                    >
                        <FaHeart /> Favorites
                    </button>
                    <button 
                        className="btn btn-outline-secondary"
                        onClick={handleLogout}
                    >
                        <FaSignOutAlt /> Logout
                    </button>
                </div>
            </div>
        </nav>
    );
}