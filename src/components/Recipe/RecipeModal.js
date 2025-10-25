import React from 'react';
import PropTypes from 'prop-types';

const RecipeModal = ({ recipe, onClose }) => {
    if (!recipe) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <h2 className="text-xl font-bold mb-4">{recipe.name}</h2>
                <h3 className="text-lg font-semibold mb-2">Ingredients:</h3>
                <ul className="list-disc list-inside mb-4">
                    {recipe.ingredients.split('\n').map((ingredient, index) => (
                        <li key={index}>{ingredient}</li>
                    ))}
                </ul>
                <h3 className="text-lg font-semibold mb-2">Instructions:</h3>
                <p>{recipe.instructions}</p>
                <button 
                    className="mt-4 bg-blue-500 text-white py-2 px-4 rounded" 
                    onClick={onClose}
                >
                    Close
                </button>
            </div>
        </div>
    );
};

RecipeModal.propTypes = {
    recipe: PropTypes.shape({
        name: PropTypes.string.isRequired,
        ingredients: PropTypes.string.isRequired,
        instructions: PropTypes.string.isRequired,
    }),
    onClose: PropTypes.func.isRequired,
};

export default RecipeModal;