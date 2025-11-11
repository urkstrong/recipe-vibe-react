import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { parseRecipeImage } from '../../services/geminiService';
import '../../styles/UploadRecipe.css';

const UploadRecipeImage = () => {
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isParsing, setIsParsing] = useState(false);
    const [error, setError] = useState('');
    const [parsingProgress, setParsingProgress] = useState(0);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    const handleImageSelect = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!supportedTypes.includes(file.type.toLowerCase())) {
            setError('Please select a JPG, PNG, or WebP image');
            return;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            setError('Image must be less than 10MB');
            return;
        }

        setSelectedImage(file);
        setError('');

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleParseRecipe = async () => {
        if (!selectedImage) return;

        setIsParsing(true);
        setError('');
        setParsingProgress(0);

        try {
            // Simulate progress
            const progressInterval = setInterval(() => {
                setParsingProgress(prev => Math.min(prev + 10, 90));
            }, 200);

            const result = await parseRecipeImage(selectedImage);
            
            clearInterval(progressInterval);
            setParsingProgress(100);

            if (result.success) {
                // Navigate back to main page with parsed recipe data in state
                navigate('/', { 
                    state: { 
                        parsedRecipe: {
                            name: result.recipe.title,
                            ingredients: result.recipe.ingredients.join('\n'),
                            instructions: result.recipe.instructions.join('\n')
                        },
                        fromPhotoUpload: true
                    } 
                });
            } else {
                setError(result.error || 'Failed to parse recipe');
            }
        } catch (err) {
            console.error('Error parsing recipe:', err);
            setError('Failed to parse recipe. Please try again.');
        } finally {
            setIsParsing(false);
            setTimeout(() => setParsingProgress(0), 500);
        }
    };

    const handleClearImage = () => {
        setSelectedImage(null);
        setImagePreview(null);
        setError('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="upload-recipe-container">
            <div className="upload-recipe-card">
                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={() => navigate('/')}
                        className="back-button"
                        disabled={isParsing}
                    >
                        <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                            <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
                        </svg>
                        Back
                    </button>
                    <h2 className="upload-recipe-title" style={{ margin: 0 }}>Upload Recipe Image</h2>
                    <div style={{ width: '80px' }}></div> {/* Spacer for centering */}
                </div>
                
                <p className="upload-recipe-subtitle">
                    Upload a photo of a handwritten or printed recipe, and we'll extract the ingredients and instructions for you.
                </p>

                {!imagePreview ? (
                    <div 
                        className="upload-dropzone"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <svg width="48" height="48" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                            <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z"/>
                        </svg>
                        <p className="upload-dropzone-text">Click to select recipe image</p>
                        <p className="upload-dropzone-hint">JPG, PNG, or WebP (max 10MB)</p>
                    </div>
                ) : (
                    <div className="image-preview-container">
                        <img src={imagePreview} alt="Recipe preview" className="image-preview" />
                        <button 
                            onClick={handleClearImage}
                            className="clear-image-btn"
                            disabled={isParsing}
                        >
                            <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                            </svg>
                        </button>
                    </div>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleImageSelect}
                    style={{ display: 'none' }}
                />

                {error && (
                    <div className="upload-error-message">
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                        </svg>
                        <span>{error}</span>
                    </div>
                )}

                {imagePreview && (
                    <button
                        onClick={handleParseRecipe}
                        disabled={isParsing}
                        className="parse-recipe-btn"
                    >
                        {isParsing ? (
                            <>
                                <svg className="spinner-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <circle cx="12" cy="12" r="10" strokeWidth="3" strokeOpacity="0.25"></circle>
                                    <path d="M12 2a10 10 0 0 1 10 10" strokeWidth="3" strokeLinecap="round"></path>
                                </svg>
                                Analyzing Recipe...
                            </>
                        ) : (
                            <>
                                <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                                    <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/>
                                </svg>
                                Parse Recipe
                            </>
                        )}
                    </button>
                )}

                {isParsing && parsingProgress > 0 && (
                    <div className="parsing-progress-bar">
                        <div 
                            className="parsing-progress-fill"
                            style={{ width: `${parsingProgress}%` }}
                        ></div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UploadRecipeImage;
