import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import useRecipes from '../../hooks/useRecipes';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../services/firebase';
import { checkUploadQuota, updateProjectStorage } from '../../utils/storageQuota';
import { compressRecipeImage } from '../../utils/imageCompression';

const AddRecipeForm = () => {
    const { user } = useAuth();
    const { addRecipe } = useRecipes(user?.uid);
    const [name, setName] = useState('');
    const [ingredients, setIngredients] = useState('');
    const [instructions, setInstructions] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef(null);

    const handleImageSelect = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Check for HEIC/HEIF files
        const fileName = file.name.toLowerCase();
        if (fileName.endsWith('.heic') || fileName.endsWith('.heif')) {
            setError('HEIC format not supported. Please convert to JPG/PNG first.');
            return;
        }

        // Validate file type
        const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!supportedTypes.includes(file.type.toLowerCase())) {
            setError('Please select a JPG, PNG, GIF, or WebP image');
            return;
        }

        // Validate file size (max 10MB before compression)
        if (file.size > 10 * 1024 * 1024) {
            setError('Original image must be less than 10MB');
            return;
        }

        setImageFile(file);
        setError('');

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!name.trim() || !ingredients.trim() || !instructions.trim()) {
            setError('Please fill in all fields');
            return;
        }

        setIsSubmitting(true);
        setError('');
        setUploadProgress(0);

        try {
            let imageUrl = null;

            // Upload image if provided
            if (imageFile) {
                setUploadProgress(10);

                // Compress the image
                console.log('Compressing recipe image...');
                const compressedFile = await compressRecipeImage(imageFile);
                setUploadProgress(30);

                // Check quota
                const quotaCheck = await checkUploadQuota(user.uid, compressedFile.size);
                if (!quotaCheck.canUpload) {
                    setError(quotaCheck.reason);
                    setIsSubmitting(false);
                    setUploadProgress(0);
                    return;
                }

                setUploadProgress(40);

                // Upload to Firebase Storage
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
                        originalSize: imageFile.size.toString(),
                        compressionRatio: ((1 - compressedFile.size / imageFile.size) * 100).toFixed(1),
                    }
                };

                setUploadProgress(60);
                await uploadBytes(storageRef, compressedFile, metadata);
                
                setUploadProgress(80);
                await updateProjectStorage(compressedFile.size);

                imageUrl = await getDownloadURL(storageRef);
                setUploadProgress(90);
            }

            // Add recipe to Firestore
            await addRecipe({
                name: name.trim(),
                ingredients: ingredients.trim(),
                instructions: instructions.trim(),
                imageUrl: imageUrl,
            });

            // Reset form
            setName('');
            setIngredients('');
            setInstructions('');
            setImageFile(null);
            setImagePreview(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            setUploadProgress(100);

            setTimeout(() => setUploadProgress(0), 500);
        } catch (err) {
            console.error('Error adding recipe:', err);
            setError('Failed to add recipe. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="add-recipe-form">
            {error && (
                <div style={{
                    padding: '0.75rem 1rem',
                    marginBottom: '1rem',
                    background: 'rgba(220, 38, 38, 0.15)',
                    border: '1.5px solid rgba(248, 113, 113, 0.4)',
                    borderRadius: '0.75rem',
                    color: '#fca5a5',
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                    </svg>
                    {error}
                </div>
            )}

            <input
                type="text"
                placeholder="Recipe Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
            />
            
            <textarea
                placeholder="Ingredients (one per line)"
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
                disabled={isSubmitting}
            />
            
            <textarea
                placeholder="Instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                disabled={isSubmitting}
            />

            {/* Image Upload Section */}
            <div style={{ marginBottom: '1rem' }}>
                <label style={{ 
                    display: 'block', 
                    color: '#cbd5e1', 
                    fontWeight: '500', 
                    marginBottom: '0.5rem',
                    fontSize: '0.875rem'
                }}>
                    Recipe Image (Optional)
                </label>
                
                {imagePreview ? (
                    <div style={{ position: 'relative', marginBottom: '1rem' }}>
                        <img 
                            src={imagePreview} 
                            alt="Recipe preview" 
                            style={{
                                width: '100%',
                                maxHeight: '300px',
                                objectFit: 'cover',
                                borderRadius: '0.75rem',
                                border: '2px solid #475569'
                            }}
                        />
                        <button
                            type="button"
                            onClick={handleRemoveImage}
                            disabled={isSubmitting}
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
                        >
                            <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                            </svg>
                        </button>
                    </div>
                ) : (
                    <div style={{
                        border: '2px dashed #475569',
                        borderRadius: '0.75rem',
                        padding: '2rem',
                        textAlign: 'center',
                        background: 'rgba(51, 65, 85, 0.3)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    >
                        <svg width="48" height="48" fill="currentColor" viewBox="0 0 16 16" style={{ margin: '0 auto 1rem', color: '#64748b' }}>
                            <path d="M10.5 8.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/>
                            <path d="M2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828.828A2 2 0 0 1 3.172 4H2zm.5 2a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1zm9 2.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0z"/>
                        </svg>
                        <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.875rem' }}>
                            Click to upload recipe image
                        </p>
                        <p style={{ color: '#64748b', margin: '0.5rem 0 0', fontSize: '0.75rem' }}>
                            JPG, PNG, GIF or WebP (max 10MB)
                        </p>
                    </div>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleImageSelect}
                    disabled={isSubmitting}
                    style={{ display: 'none' }}
                />
            </div>

            {uploadProgress > 0 && uploadProgress < 100 && (
                <div style={{ marginBottom: '1rem' }}>
                    <div style={{
                        width: '100%',
                        height: '4px',
                        background: 'rgba(71, 85, 105, 0.5)',
                        borderRadius: '2px',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            width: `${uploadProgress}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #3b82f6, #6366f1)',
                            transition: 'width 0.3s ease'
                        }}></div>
                    </div>
                    <p style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '0.5rem', textAlign: 'center' }}>
                        {uploadProgress < 40 ? 'Compressing image...' : 
                         uploadProgress < 80 ? 'Uploading...' : 
                         'Saving recipe...'}
                    </p>
                </div>
            )}
            
            <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Adding Recipe...' : 'Add Recipe'}
            </button>
        </form>
    );
};

export default AddRecipeForm;