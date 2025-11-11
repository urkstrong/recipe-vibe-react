import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import Header from './components/Layout/Header';
import MainContent from './components/Layout/MainContent';
import UserProfile from './components/User/UserProfile';
import UploadRecipeImage from './components/Recipe/UploadRecipeImage';
import './App.css';

function AppContent() {
  const { user } = useAuth();
  
  return (
    <div className="App">
      {user && <Header />}
      <Routes>
        <Route path="/" element={<MainContent />} />
        <Route path="/user/:userId" element={<UserProfile />} />
        <Route path="/upload-recipe" element={<UploadRecipeImage />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;