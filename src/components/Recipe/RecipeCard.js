import React, { useState, useRef, useEffect } from 'react';

const RecipeCard = ({ recipe, onDelete, onUpdate }) => {
    const { id, name, ingredients, instructions } = recipe;
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(name);
    const [editIngredients, setEditIngredients] = useState(ingredients);
    const [editInstructions, setEditInstructions] = useState(instructions);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const ingredientsTextareaRef = useRef(null);
    const instructionsTextareaRef = useRef(null);

    const handleDelete = () => {
        setShowDeleteConfirm(true);
    };

    const handleEdit = () => {
        setIsEditing(true);
        setEditName(name);
        setEditIngredients(ingredients);
        setEditInstructions(instructions);
    };

    const handleSave = async () => {
        if (typeof onUpdate !== 'function') return;
        
        setIsSubmitting(true);
        try {
            await onUpdate(id, {
                name: editName,
                ingredients: editIngredients,
                instructions: editInstructions,
            });
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating recipe:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditName(name);
        setEditIngredients(ingredients);
        setEditInstructions(instructions);
    };

    const confirmDelete = () => {
        onDelete(id);
        setShowDeleteConfirm(false);
    };

    const cancelDelete = () => {
        setShowDeleteConfirm(false);
    };

    const autoResize = (textarea) => {
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';
        }
    };

    useEffect(() => {
        if (isEditing) {
            setTimeout(() => {
                autoResize(ingredientsTextareaRef.current);
                autoResize(instructionsTextareaRef.current);
            }, 0);
        }
    }, [isEditing]);

    return (
        <>
            <div className="recipe-card group">
                <div className="flex justify-between items-start mb-4">
                    {isEditing ? (
                        <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="flex-1 mr-3 px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white text-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Recipe name..."
                        />
                    ) : (
                        <h3 className="text-xl font-bold text-white truncate flex-1 mr-3">
                            {name}
                        </h3>
                    )}
                    <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                        {isEditing ? (
                            <>
                                <button
                                    onClick={handleSave}
                                    disabled={isSubmitting}
                                    className="edit-btn p-2 rounded-lg transition-all duration-200"
                                    title="Save changes"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" className="text-blue-400 hover:text-blue-300" viewBox="0 0 16 16">
                                        <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
                                    </svg>
                                </button>
                                <button
                                    onClick={handleCancel}
                                    className="delete-btn p-2 rounded-lg transition-all duration-200"
                                    title="Cancel editing"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" className="text-red-400 hover:text-red-300" viewBox="0 0 16 16">
                                        <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                                    </svg>
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={handleEdit}
                                    className="edit-btn p-2 rounded-lg transition-all duration-200"
                                    title="Edit recipe"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" className="text-blue-400 hover:text-blue-300" viewBox="0 0 16 16">
                                        <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708L10.5 8.207l-3-3L12.146.146ZM11.207 9l-3-3L2.5 11.707V14.5a.5.5 0 0 0 .5.5h2.793L11.207 9ZM1 11.5a.5.5 0 0 1 .5-.5H2v-.793L8.146 4.561l3 3L5 13.707V14.5a1.5 1.5 0 0 1-1.5 1.5H1.5A1.5 1.5 0 0 1 0 14.5v-3Z"/>
                                    </svg>
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="delete-btn p-2 rounded-lg transition-all duration-200"
                                    title="Delete recipe"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" className="text-red-400 hover:text-red-300" viewBox="0 0 16 16">
                                        <path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5Zm-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5ZM4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06Zm3 0l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06Zm3 .5a.5.5 0 0 0-1 0v8.5a.5.5 0 0 0 1 0v-8.5Z"/>
                                    </svg>
                                </button>
                            </>
                        )}
                    </div>
                </div>
                
                <div className="mb-4">
                    <h4 className="text-xs font-semibold text-blue-400 mb-2 uppercase tracking-wide">Ingredients</h4>
                    {isEditing ? (
                        <textarea
                            ref={ingredientsTextareaRef}
                            value={editIngredients}
                            onChange={(e) => {
                                setEditIngredients(e.target.value);
                                autoResize(e.target);
                            }}
                            className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-hidden"
                            placeholder="List ingredients..."
                            style={{ 
                                minHeight: '60px',
                                minWidth: '100%',
                                width: 'calc(100% + 2rem)',
                                marginLeft: '-1rem',
                                paddingLeft: '1rem',
                                paddingRight: '1rem'
                            }}
                        />
                    ) : (
                        <p className="text-slate-300 text-sm line-clamp-3 leading-relaxed">
                            {ingredients.replace(/\n/g, ' • ')}
                        </p>
                    )}
                </div>

                <div>
                    <h4 className="text-xs font-semibold text-blue-400 mb-2 uppercase tracking-wide">Instructions</h4>
                    {isEditing ? (
                        <textarea
                            ref={instructionsTextareaRef}
                            value={editInstructions}
                            onChange={(e) => {
                                setEditInstructions(e.target.value);
                                autoResize(e.target);
                            }}
                            className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-hidden"
                            placeholder="Cooking instructions..."
                            style={{ 
                                minHeight: '80px',
                                minWidth: '100%',
                                width: 'calc(100% + 2rem)',
                                marginLeft: '-1rem',
                                paddingLeft: '1rem',
                                paddingRight: '1rem'
                            }}
                        />
                    ) : (
                        <p className="text-slate-300 text-sm line-clamp-3 leading-relaxed">
                            {instructions}
                        </p>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="modal-backdrop fixed inset-0 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-xl p-6 max-w-sm w-full shadow-2xl border border-slate-600">
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-900/50 mb-4 border border-red-500/30">
                                <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">Delete Recipe</h3>
                            <p className="text-sm text-slate-400 mb-6">
                                Are you sure you want to delete "{name}"? This action cannot be undone.
                            </p>
                            <div className="flex space-x-3">
                                <button 
                                    className="flex-1 bg-slate-700 text-slate-300 py-2 px-4 rounded-lg font-medium hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-colors" 
                                    onClick={cancelDelete}
                                >
                                    Cancel
                                </button>
                                <button 
                                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors" 
                                    onClick={confirmDelete}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default RecipeCard;