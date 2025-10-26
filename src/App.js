import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Layout/Header';
import MainContent from './components/Layout/MainContent';
import { useAuth } from './context/AuthContext';
import UserProfile from './components/User/UserProfile';
import './App.css';

function AppContent() {
    const { user, loading } = useAuth();
    
    if (loading) {
        return (
            <div className="App min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="loader mx-auto mb-4"></div>
                    <p className="text-slate-400 text-lg">Loading Recipe Vibe...</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="App min-h-screen bg-gray-50">
            {user && <Header />}
            <Routes>
                <Route path="/" element={<MainContent />} />
                <Route path="/user/:userId" element={<UserProfile />} />
            </Routes>
        </div>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;