import React from 'react';
import { useAuth } from '../../context/AuthContext';
import RecipeList from '../Recipe/RecipeList';
import AddRecipeForm from '../Recipe/AddRecipeForm';
import UsersList from '../User/UsersList';
import Tabs from '../UI/Tabs';
import GoogleSignIn from '../Auth/GoogleSignIn';
import useFavorites from '../../hooks/useFavorites';
import RecipeCard from '../Recipe/RecipeCard';
import LoadingState from '../UI/LoadingState';
import { useNavigate } from 'react-router-dom';

const MainContent = () => {
    const { user } = useAuth();
    const { favoriteRecipes, loading: favoritesLoading } = useFavorites(user?.uid);
    const navigate = useNavigate();

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
                        <p className="text-slate-400 text-lg mb-6">Choose how you'd like to add your recipe</p>
                        
                        {/* Recipe Creation Options */}
                        <div className="flex justify-center gap-4 mb-8">
                            <button
                                onClick={() => {
                                    // Option already selected by default - just scroll to form
                                    document.querySelector('.add-recipe-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }}
                                className="recipe-option-btn"
                                style={{
                                    padding: '1.5rem 2rem',
                                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
                                    border: '2px solid rgba(59, 130, 246, 0.5)',
                                    borderRadius: '1rem',
                                    color: 'white',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    minWidth: '200px',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(59, 130, 246, 0.3)';
                                    e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.8)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                    e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                                }}
                            >
                                <svg width="48" height="48" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M5 1a2 2 0 0 0-2 2v2H2a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h1v1a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-1h1a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1V3a2 2 0 0 0-2-2H5zM4 3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2H4V3zm1 5a2 2 0 0 0-2 2v1H2a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v-1a2 2 0 0 0-2-2H5zm7 2v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1z"/>
                                </svg>
                                <div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.25rem' }}>Manual Entry</div>
                                    <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Type your recipe details</div>
                                </div>
                            </button>

                            <button
                                onClick={() => navigate('/upload-recipe')}
                                className="recipe-option-btn"
                                style={{
                                    padding: '1.5rem 2rem',
                                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)',
                                    border: '2px solid rgba(139, 92, 246, 0.5)',
                                    borderRadius: '1rem',
                                    color: 'white',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    minWidth: '200px',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(139, 92, 246, 0.3)';
                                    e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.8)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                    e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.5)';
                                }}
                            >
                                <svg width="48" height="48" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M10.5 8.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/>
                                    <path d="M2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828.828A2 2 0 0 1 3.172 4H2zm.5 2a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1zm9 2.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0z"/>
                                </svg>
                                <div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.25rem' }}>Photo Upload</div>
                                    <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Scan a recipe image</div>
                                </div>
                            </button>
                        </div>
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
            label: 'My Favorites',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
            ),
            content: (
                <div>
                    <div className="mb-8 text-center">
                        <h2 className="text-3xl font-bold text-white mb-4 high-contrast-text">Your Favorite Recipes</h2>
                        <p className="text-slate-400 text-lg">Recipes you've saved from the community</p>
                    </div>
                    <div className="max-w-6xl mx-auto">
                        {favoritesLoading ? (
                            <LoadingState />
                        ) : favoriteRecipes.length === 0 ? (
                            <div className="text-center p-12">
                                <div className="mx-auto h-24 w-24 text-slate-500 mb-6">
                                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-full h-full">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-slate-300 mb-2">No Favorites Yet</h3>
                                <p className="text-slate-500 max-w-sm mx-auto leading-relaxed">
                                    Start exploring other users' recipes and add your favorites!
                                </p>
                            </div>
                        ) : (
                            <div className="recipe-grid">
                                {favoriteRecipes.map(recipe => (
                                    <RecipeCard
                                        key={recipe.id}
                                        recipe={recipe}
                                        showFavorite={true}
                                        recipeOwnerId={recipe.ownerId}
                                        ownerName={recipe.ownerName}
                                        readOnly={true}
                                    />
                                ))}
                            </div>
                        )}
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