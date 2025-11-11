import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import useRecipes from '../../hooks/useRecipes';
import '../../styles/ReviewRecipe.css';

const ReviewRecipe = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { addRecipe } = useRecipes(user?.uid);
    const { parsedRecipe, originalImage } = location.state || {};

    const [recipe, setRecipe] = useState(parsedRecipe || {
        title: '',
        description: '',
        prepTime: '',
        cookTime: '',
        servings: '',
        ingredients: [],
        instructions: []
    });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [newIngredient, setNewIngredient] = useState('');
    const [newInstruction, setNewInstruction] = useState('');

    if (!parsedRecipe) {
        navigate('/upload-recipe');
        return null;
    }

    const handleInputChange = (field, value) => {
        setRecipe(prev => ({ ...prev, [field]: value }));
    };

    const handleAddIngredient = () => {
        if (newIngredient.trim()) {
            setRecipe(prev => ({
                ...prev,
                ingredients: [...prev.ingredients, newIngredient.trim()]
            }));
            setNewIngredient('');
        }
    };

    const handleRemoveIngredient = (index) => {
        setRecipe(prev => ({
            ...prev,
            ingredients: prev.ingredients.filter((_, i) => i !== index)
        }));
    };

    const handleEditIngredient = (index, value) => {
        setRecipe(prev => ({
            ...prev,
            ingredients: prev.ingredients.map((ing, i) => i === index ? value : ing)
        }));
    };

    const handleAddInstruction = () => {
        if (newInstruction.trim()) {
            setRecipe(prev => ({
                ...prev,
                instructions: [...prev.instructions, newInstruction.trim()]
            }));
            setNewInstruction('');
        }
    };

    const handleRemoveInstruction = (index) => {
        setRecipe(prev => ({
            ...prev,
            instructions: prev.instructions.filter((_, i) => i !== index)
        }));
    };

    const handleEditInstruction = (index, value) => {
        setRecipe(prev => ({
            ...prev,
            instructions: prev.instructions.map((inst, i) => i === index ? value : inst)
        }));
    };

    const handleSaveRecipe = async () => {
        if (!recipe.title.trim()) {
            setError('Please add a recipe title');
            return;
        }

        if (recipe.ingredients.length === 0) {
            setError('Please add at least one ingredient');
            return;
        }

        if (recipe.instructions.length === 0) {
            setError('Please add at least one instruction step');
            return;
        }

        setIsSaving(true);
        setError('');

        try {
            const recipeData = {
                name: recipe.title,
                ingredients: recipe.ingredients.join('\n'),
                instructions: recipe.instructions.join('\n'),
                imageUrl: null, // We're not saving the scanned image, just the parsed data
            };

            await addRecipe(recipeData);
            navigate('/');
        } catch (err) {
            console.error('Error saving recipe:', err);
            setError('Failed to save recipe. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="review-recipe-container">
            <div className="review-recipe-layout">
                {originalImage && (
                    <div className="review-image-panel">
                        <h3>Original Recipe</h3>
                        <img src={originalImage} alt="Original recipe" className="review-original-image" />
                    </div>
                )}

                <div className="review-form-panel">
                    <div className="review-header">
                        <h2>Review & Edit Recipe</h2>
                        <p>Review the extracted information and make any necessary corrections before saving.</p>
                    </div>

                    {error && (
                        <div className="review-error-message">
                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="review-form">
                        <div className="form-group">
                            <label>Recipe Title *</label>
                            <input
                                type="text"
                                value={recipe.title}
                                onChange={(e) => handleInputChange('title', e.target.value)}
                                placeholder="Enter recipe title"
                                className="form-input"
                            />
                        </div>

                        <div className="form-group">
                            <label>Description</label>
                            <textarea
                                value={recipe.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                placeholder="Brief description of the recipe"
                                className="form-textarea"
                                rows="3"
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Prep Time</label>
                                <input
                                    type="text"
                                    value={recipe.prepTime}
                                    onChange={(e) => handleInputChange('prepTime', e.target.value)}
                                    placeholder="e.g., 15 minutes"
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label>Cook Time</label>
                                <input
                                    type="text"
                                    value={recipe.cookTime}
                                    onChange={(e) => handleInputChange('cookTime', e.target.value)}
                                    placeholder="e.g., 30 minutes"
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label>Servings</label>
                                <input
                                    type="text"
                                    value={recipe.servings}
                                    onChange={(e) => handleInputChange('servings', e.target.value)}
                                    placeholder="e.g., 4"
                                    className="form-input"
                                />
                            </div>
                        </div>

                        <div className="form-section">
                            <label>Ingredients *</label>
                            <div className="list-items">
                                {recipe.ingredients.map((ingredient, index) => (
                                    <div key={index} className="list-item">
                                        <span className="list-item-number">{index + 1}.</span>
                                        <input
                                            type="text"
                                            value={ingredient}
                                            onChange={(e) => handleEditIngredient(index, e.target.value)}
                                            className="list-item-input"
                                        />
                                        <button
                                            onClick={() => handleRemoveIngredient(index)}
                                            className="list-item-remove"
                                        >
                                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <div className="add-item-container">
                                <input
                                    type="text"
                                    value={newIngredient}
                                    onChange={(e) => setNewIngredient(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddIngredient()}
                                    placeholder="Add new ingredient"
                                    className="add-item-input"
                                />
                                <button onClick={handleAddIngredient} className="add-item-btn">
                                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                        <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                                    </svg>
                                    Add
                                </button>
                            </div>
                        </div>

                        <div className="form-section">
                            <label>Instructions *</label>
                            <div className="list-items">
                                {recipe.instructions.map((instruction, index) => (
                                    <div key={index} className="list-item">
                                        <span className="list-item-number">{index + 1}.</span>
                                        <textarea
                                            value={instruction}
                                            onChange={(e) => handleEditInstruction(index, e.target.value)}
                                            className="list-item-textarea"
                                            rows="2"
                                        />
                                        <button
                                            onClick={() => handleRemoveInstruction(index)}
                                            className="list-item-remove"
                                        >
                                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <div className="add-item-container">
                                <textarea
                                    value={newInstruction}
                                    onChange={(e) => setNewInstruction(e.target.value)}
                                    placeholder="Add new instruction step"
                                    className="add-item-textarea"
                                    rows="2"
                                />
                                <button onClick={handleAddInstruction} className="add-item-btn">
                                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                        <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                                    </svg>
                                    Add
                                </button>
                            </div>
                        </div>

                        <div className="review-actions">
                            <button
                                onClick={() => navigate('/upload-recipe')}
                                className="cancel-btn"
                                disabled={isSaving}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveRecipe}
                                disabled={isSaving}
                                className="save-recipe-btn"
                            >
                                {isSaving ? (
                                    <>
                                        <svg className="spinner-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <circle cx="12" cy="12" r="10" strokeWidth="3" strokeOpacity="0.25"></circle>
                                            <path d="M12 2a10 10 0 0 1 10 10" strokeWidth="3" strokeLinecap="round"></path>
                                        </svg>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                                            <path d="M2 1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H9.5a1 1 0 0 0-1 1v7.293l2.646-2.647a.5.5 0 0 1 .708.708l-3.5 3.5a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L7.5 9.293V2a2 2 0 0 1 2-2H14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h2.5a.5.5 0 0 1 0 1H2z"/>
                                        </svg>
                                        Save Recipe
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReviewRecipe;
