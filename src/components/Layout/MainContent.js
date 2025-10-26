import React from 'react';
import { useAuth } from '../../context/AuthContext';
import RecipeList from '../Recipe/RecipeList';
import AddRecipeForm from '../Recipe/AddRecipeForm';
import UsersList from '../User/UsersList';
import Tabs from '../UI/Tabs';
import GoogleSignIn from '../Auth/GoogleSignIn';

const MainContent = () => {
    const { user } = useAuth();

    console.log('MainContent render - User:', user);

    if (!user) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center p-16">
                <div className="welcome-section rounded-3xl p-20 text-center w-full max-w-5xl min-h-[70vh] flex flex-col items-center justify-center mx-auto my-8" style={{ padding: '20px' }}>
                    <div className="flex-1 flex flex-col justify-center">
                        <h1 className="text-7xl font-bold text-white mb-10 high-contrast-text">Recipe Vibe</h1>
                        <h2 className="text-4xl font-semibold text-white mb-10 high-contrast-text">Welcome!</h2>
                        <p className="text-slate-300 text-2xl leading-relaxed mb-16 max-w-3xl mx-auto">
                            Discover, create, and share your favorite recipes. Sign in to start building your personal recipe collection.
                        </p>
                        <div className="flex justify-center">
                            <GoogleSignIn />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const tabs = [
        {
            label: 'Add Recipe',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
            ),
            content: (
                <div>
                    <div className="mb-8 text-center">
                        <h2 className="text-3xl font-bold text-white mb-4 high-contrast-text">Create New Recipe</h2>
                        <p className="text-slate-400 text-lg">Share your culinary creations with the world</p>
                    </div>
                    <div className="max-w-3xl mx-auto">
                        <AddRecipeForm />
                    </div>
                </div>
            )
        },
        {
            label: 'My Recipes',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
            ),
            content: (
                <div>
                    <div className="mb-8 text-center">
                        <h2 className="text-3xl font-bold text-white mb-4 high-contrast-text">Your Recipe Collection</h2>
                        <p className="text-slate-400 text-lg">Manage and organize your favorite recipes</p>
                    </div>
                    <div className="max-w-6xl mx-auto">
                        <RecipeList />
                    </div>
                </div>
            )
        },
        {
            label: 'Discover Users',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            ),
            content: (
                <div>
                    <div className="mb-8 text-center">
                        <h2 className="text-3xl font-bold text-white mb-4 high-contrast-text">Discover Other Cooks</h2>
                        <p className="text-slate-400 text-lg">Connect with other food lovers and explore their recipes</p>
                    </div>
                    <div className="max-w-6xl mx-auto">
                        <UsersList />
                    </div>
                </div>
            )
        }
    ];

    return (
        <div className="min-h-screen p-8">
            <div className="container mx-auto">
                <div className="max-w-7xl mx-auto">
                    <Tabs tabs={tabs} defaultTab={0} />
                </div>
            </div>
        </div>
    );
};

export default MainContent;