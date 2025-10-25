import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import useRecipes from '../../hooks/useRecipes';

const AddRecipeForm = () => {
    const { user } = useAuth();
    const { addRecipe } = useRecipes(user?.uid);
    const [recipeName, setRecipeName] = useState('');
    const [recipeIngredients, setRecipeIngredients] = useState('');
    const [recipeInstructions, setRecipeInstructions] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!user?.uid) {
            setError('User not authenticated, cannot add recipe.');
            return;
        }

        setIsSubmitting(true);
        const recipe = {
            name: recipeName,
            ingredients: recipeIngredients,
            instructions: recipeInstructions,
            createdAt: new Date(),
            userId: user.uid,
        };

        try {
            await addRecipe(recipe);
            setRecipeName('');
            setRecipeIngredients('');
            setRecipeInstructions('');
            setError('');
        } catch (error) {
            setError('Error adding recipe: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="add-recipe-form">
            <form onSubmit={handleSubmit}>
                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-600 text-sm">{error}</p>
                    </div>
                )}
                
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Recipe Name
                    </label>
                    <input
                        type="text"
                        placeholder="Enter recipe name..."
                        value={recipeName}
                        onChange={(e) => setRecipeName(e.target.value)}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ingredients
                    </label>
                    <textarea
                        placeholder="List ingredients (one per line)..."
                        value={recipeIngredients}
                        onChange={(e) => setRecipeIngredients(e.target.value)}
                        required
                        rows="4"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                    />
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Instructions
                    </label>
                    <textarea
                        placeholder="Describe the cooking steps..."
                        value={recipeInstructions}
                        onChange={(e) => setRecipeInstructions(e.target.value)}
                        required
                        rows="5"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                    />
                </div>

                <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                    {isSubmitting ? 'Adding Recipe...' : 'Add Recipe'}
                </button>
            </form>
        </div>
    );
};

export default AddRecipeForm;