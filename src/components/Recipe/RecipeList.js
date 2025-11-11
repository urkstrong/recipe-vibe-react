import React from 'react';
import { useAuth } from '../../context/AuthContext';
import useRecipes from '../../hooks/useRecipes';
import RecipeCard from './RecipeCard';
import LoadingState from '../UI/LoadingState';
import EmptyState from '../UI/EmptyState';

const RecipeList = () => {
    const { user } = useAuth();
    const { recipes, loading, error, deleteRecipe, updateRecipe } = useRecipes(user?.uid);

    console.log('RecipeList render - User:', user?.uid, 'Recipes:', recipes, 'Loading:', loading, 'Error:', error);

    if (loading) {
        return (
            <div className="tab-loading">
                <LoadingState />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center p-8">
                <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6 max-w-md mx-auto">
                    <h2 className="text-xl font-bold text-red-400 mb-2">Error Loading Recipes</h2>
                    <p className="text-red-300 text-sm">{error.message}</p>
                </div>
            </div>
        );
    }

    if (recipes.length === 0) {
        return (
            <div className="tab-empty">
                <EmptyState />
            </div>
        );
    }

    return (
        <div className="recipe-grid">
            {recipes.map(recipe => (
                <RecipeCard 
                    key={recipe.id} 
                    recipe={recipe} 
                    onDelete={deleteRecipe} 
                    onUpdate={updateRecipe}
                    showFavorite={true}
                    recipeOwnerId={user?.uid}
                    ownerName={user?.displayName}
                />
            ))}
        </div>
    );
};

export default RecipeList;