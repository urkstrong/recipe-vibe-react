import React, { useState, useRef, useEffect } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { checkUploadQuota, updateProjectStorage, deleteRecipeImage } from '../../utils/storageQuota';
import { compressRecipeImage } from '../../utils/imageCompression';
import useFavorites from '../../hooks/useFavorites';

const RecipeCard = ({ recipe, onDelete, onUpdate, showFavorite = true, recipeOwnerId, ownerName, readOnly = false }) => {
    const { id, name, ingredients, instructions, imageUrl } = recipe;
    const { user } = useAuth();
    const { toggleFavorite, isFavorited, getRecipeFavoriteCount } = useFavorites(user?.uid);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(name);
    const [editIngredients, setEditIngredients] = useState(ingredients);
    const [editInstructions, setEditInstructions] = useState(instructions);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editImageFile, setEditImageFile] = useState(null);
    const [editImagePreview, setEditImagePreview] = useState(imageUrl);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [favoriteCount, setFavoriteCount] = useState(0);
    const ingredientsTextareaRef = useRef(null);
    const instructionsTextareaRef = useRef(null);
    const editFileInputRef = useRef(null);

    const isOwner = user?.uid === recipeOwnerId;
    const canEdit = isOwner && !readOnly;

    const handleDelete = () => {
        setShowDeleteConfirm(true);
    };

    const handleEdit = () => {
        setIsEditing(true);
        setEditName(name);
        setEditIngredients(ingredients);
        setEditInstructions(instructions);
        setEditImagePreview(imageUrl);
        setEditImageFile(null);
        setUploadError('');
    };

    const handleImageSelect = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploadError('');

        // Check for HEIC/HEIF files
        const fileName = file.name.toLowerCase();
        if (fileName.endsWith('.heic') || fileName.endsWith('.heif')) {
            setUploadError('HEIC format not supported. Please convert to JPG/PNG first.');
            return;
        }

        // Validate file type
        const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!supportedTypes.includes(file.type.toLowerCase())) {
            setUploadError('Please select a JPG, PNG, GIF, or WebP image');
            return;
        }

        // Validate file size (max 10MB before compression)
        if (file.size > 10 * 1024 * 1024) {
            setUploadError('Original image must be less than 10MB');
            return;
        }

        setEditImageFile(file);

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setEditImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveImage = () => {
        setEditImageFile(null);
        setEditImagePreview(null);
        if (editFileInputRef.current) {
            editFileInputRef.current.value = '';
        }
    };

    const handleSave = async () => {
        if (typeof onUpdate !== 'function') return;
        
        setIsSubmitting(true);
        setUploadError('');

        try {
            let newImageUrl = editImagePreview;

            // Handle image upload if new image selected
            if (editImageFile) {
                setIsUploadingImage(true);

                // Compress the image
                console.log('Compressing recipe image...');
                const compressedFile = await compressRecipeImage(editImageFile);

                // Check quota
                const quotaCheck = await checkUploadQuota(user.uid, compressedFile.size);
                if (!quotaCheck.canUpload) {
                    setUploadError(quotaCheck.reason);
                    setIsSubmitting(false);
                    setIsUploadingImage(false);
                    return;
                }

                // Delete old image if exists
                if (imageUrl) {
                    await deleteRecipeImage(imageUrl);
                }

                // Upload new image
                const timestamp = Date.now();
                const fileExtension = compressedFile.type.split('/')[1];
                const storagePath = `recipe-images/${user.uid}/${timestamp}.${fileExtension}`;
                const storageRef = ref(storage, storagePath);

                const metadata = {
                    contentType: compressedFile.type,
                    customMetadata: {
                        uploadedBy: user.uid,
                        uploadedAt: new Date().toISOString(),
                        fileSize: compressedFile.size.toString(),
                        originalSize: editImageFile.size.toString(),
                        compressionRatio: ((1 - compressedFile.size / editImageFile.size) * 100).toFixed(1),
                        recipeId: id,
                    }
                };

                await uploadBytes(storageRef, compressedFile, metadata);
                await updateProjectStorage(compressedFile.size);
                newImageUrl = await getDownloadURL(storageRef);

                setIsUploadingImage(false);
            } else if (editImagePreview === null && imageUrl) {
                // User removed the image
                await deleteRecipeImage(imageUrl);
                newImageUrl = null;
            }

            // Update recipe with new data
            await onUpdate(id, {
                name: editName,
                ingredients: editIngredients,
                instructions: editInstructions,
                imageUrl: newImageUrl,
            });

            setIsEditing(false);
            setEditImageFile(null);
        } catch (error) {
            console.error('Error updating recipe:', error);
            setUploadError('Failed to update recipe. Please try again.');
        } finally {
            setIsSubmitting(false);
            setIsUploadingImage(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditName(name);
        setEditIngredients(ingredients);
        setEditInstructions(instructions);
        setEditImagePreview(imageUrl);
        setEditImageFile(null);
        setUploadError('');
        if (editFileInputRef.current) {
            editFileInputRef.current.value = '';
        }
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

    // Load favorite count on mount and when recipe changes
    useEffect(() => {
        const loadFavoriteCount = async () => {
            if (recipeOwnerId && id && getRecipeFavoriteCount) {
                const count = await getRecipeFavoriteCount(id, recipeOwnerId);
                setFavoriteCount(count);
            }
        };
        loadFavoriteCount();
    }, [id, recipeOwnerId, getRecipeFavoriteCount]);

    const handleFavoriteClick = async (e) => {
        e.stopPropagation();
        if (showFavorite && recipeOwnerId) {
            await toggleFavorite(id, recipeOwnerId, ownerName);
            // Refresh count after toggle
            if (getRecipeFavoriteCount) {
                const count = await getRecipeFavoriteCount(id, recipeOwnerId);
                setFavoriteCount(count);
            }
        }
    };

    return (
        <>
            <div className={`recipe-card group ${!canEdit ? 'view-only' : ''}`}>
                {/* Image Section with Favorite Button */}
                {isEditing ? (
                    <div style={{ marginBottom: '1rem' }}>
                        {editImagePreview ? (
                            <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
                                <img 
                                    src={editImagePreview} 
                                    alt="Recipe preview" 
                                    style={{
                                        width: '100%',
                                        height: '200px',
                                        objectFit: 'cover',
                                        borderRadius: '0.75rem',
                                        border: '2px solid #475569'
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={handleRemoveImage}
                                    disabled={isSubmitting || isUploadingImage}
                                    style={{
                                        position: 'absolute',
                                        top: '0.5rem',
                                        right: '0.5rem',
                                        background: 'rgba(220, 38, 38, 0.9)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '0.5rem',
                                        padding: '0.5rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.2s ease'
                                    }}
                                    title="Remove image"
                                >
                                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                                        <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                                    </svg>
                                </button>
                                {isUploadingImage && (
                                    <div style={{
                                        position: 'absolute',
                                        inset: 0,
                                        background: 'rgba(0, 0, 0, 0.7)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: '0.75rem'
                                    }}>
                                        <svg className="spinner-icon" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white">
                                            <circle cx="12" cy="12" r="10" strokeWidth="3" strokeOpacity="0.25"></circle>
                                            <path d="M12 2a10 10 0 0 1 10 10" strokeWidth="3" strokeLinecap="round"></path>
                                        </svg>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div 
                                style={{
                                    border: '2px dashed #475569',
                                    borderRadius: '0.75rem',
                                    padding: '2rem',
                                    textAlign: 'center',
                                    background: 'rgba(51, 65, 85, 0.3)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    marginBottom: '0.5rem'
                                }}
                                onClick={() => editFileInputRef.current?.click()}
                            >
                                <svg width="40" height="40" fill="currentColor" viewBox="0 0 16 16" style={{ margin: '0 auto 0.5rem', color: '#64748b' }}>
                                    <path d="M10.5 8.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/>
                                    <path d="M2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828.828A2 2 0 0 1 3.172 4H2zm.5 2a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1zm9 2.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0z"/>
                                </svg>
                                <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.75rem' }}>
                                    Click to {imageUrl ? 'change' : 'add'} image
                                </p>
                            </div>
                        )}
                        <input
                            ref={editFileInputRef}
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                            onChange={handleImageSelect}
                            disabled={isSubmitting || isUploadingImage}
                            style={{ display: 'none' }}
                        />
                        {uploadError && (
                            <div style={{
                                padding: '0.5rem 0.75rem',
                                marginTop: '0.5rem',
                                background: 'rgba(220, 38, 38, 0.15)',
                                border: '1px solid rgba(248, 113, 113, 0.4)',
                                borderRadius: '0.5rem',
                                color: '#fca5a5',
                                fontSize: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}>
                                <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                            </svg>
                                {uploadError}
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={{ position: 'relative', marginBottom: '1rem', borderRadius: '0.75rem', overflow: 'hidden' }}>
                        {imageUrl ? (
                            <img 
                                src={imageUrl} 
                                alt={name}
                                style={{
                                    width: '100%',
                                    height: '200px',
                                    objectFit: 'cover',
                                    display: 'block'
                                }}
                            />
                        ) : (
                            <div style={{
                                width: '100%',
                                height: '200px',
                                background: 'linear-gradient(135deg, rgba(51, 65, 85, 0.5), rgba(71, 85, 105, 0.5))',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <svg width="80" height="80" fill="rgba(148, 163, 184, 0.3)" viewBox="0 0 16 16">
                                    <path d="M10.5 8.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/>
                                    <path d="M2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828.828A2 2 0 0 1 3.172 4H2zm.5 2a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1zm9 2.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0z"/>
                                </svg>
                            </div>
                        )}
                        
                        {/* Favorite Button - Top Left */}
                        {showFavorite && recipeOwnerId && (
                            <button
                                onClick={handleFavoriteClick}
                                className={`recipe-favorite-btn ${isFavorited(id) ? 'favorited' : ''}`}
                                title={isFavorited(id) ? 'Remove from favorites' : 'Add to favorites'}
                            >
                                <svg width="24" height="24" fill={isFavorited(id) ? 'currentColor' : 'none'} stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                                {favoriteCount > 0 && (
                                    <span className="favorite-count-badge">{favoriteCount}</span>
                                )}
                            </button>
                        )}
                    </div>
                )}
                
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
                        <div className="flex-1 mr-3">
                            <h3 className="text-xl font-bold text-white truncate">
                                {name}
                            </h3>
                            {!isOwner && ownerName && (
                                <p className="text-xs text-slate-400 italic mt-1">by {ownerName}</p>
                            )}
                        </div>
                    )}
                    <div className={`flex space-x-2 ${canEdit ? 'opacity-0 group-hover:opacity-100' : 'opacity-0'} transition-all duration-200`} style={{ alignSelf: 'flex-start' }}>
                        {canEdit && (
                            <>
                                {isEditing ? (
                                    <>
                                        <button
                                            onClick={handleSave}
                                            disabled={isSubmitting}
                                            className="edit-btn p-2 rounded-lg transition-all duration-200"
                                            title="Save changes"
                                            style={{ 
                                                width: '38px', 
                                                height: '38px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0
                                            }}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" className="text-blue-400 hover:text-blue-300" viewBox="0 0 16 16">
                                                <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
                                            </svg>
                                        </button>
                                        <button
                                            onClick={handleCancel}
                                            className="delete-btn p-2 rounded-lg transition-all duration-200"
                                            title="Cancel editing"
                                            style={{ 
                                                width: '38px', 
                                                height: '38px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0
                                            }}
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
                                            style={{ 
                                                width: '38px', 
                                                height: '38px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0
                                            }}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" className="text-blue-400 hover:text-blue-300" viewBox="0 0 16 16">
                                                <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
                                                <path fillRule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/>
                                            </svg>
                                        </button>
                                        <button
                                            onClick={handleDelete}
                                            className="delete-btn p-2 rounded-lg transition-all duration-200"
                                            title="Delete recipe"
                                            style={{ 
                                                width: '38px', 
                                                height: '38px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0
                                            }}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" className="text-red-400 hover:text-red-300" viewBox="0 0 16 16">
                                                <path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5Zm-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5ZM4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06Zm3 0l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06Zm3 .5a.5.5 0 0 0-1 0v8.5a.5.5 0 0 0 1 0v-8.5Z"/>
                                            </svg>
                                        </button>
                                    </>
                                )}
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