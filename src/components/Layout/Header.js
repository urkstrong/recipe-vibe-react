import React from 'react';
import { useAuth } from '../../context/AuthContext';
import GoogleSignIn from '../Auth/GoogleSignIn';

const Header = () => {
    const { user } = useAuth();

    return (
        <header className="bg-slate-900/95 backdrop-blur-md p-4 text-white shadow-lg border-b border-slate-700/50">
            <div className="container mx-auto flex justify-between items-center">
                <h1 className="text-2xl font-bold">
                    Recipe Vibe
                </h1>
                
                <div className="flex items-center space-x-4">
                    <div className="text-right">
                        <p className="text-sm font-medium">{user.displayName || 'User'}</p>
                        <p className="text-xs text-slate-400">{user.email}</p>
                    </div>
                    <GoogleSignIn />
                </div>
            </div>
        </header>
    );
};

export default Header;