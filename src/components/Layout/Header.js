import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../services/firebase';
import useUsers from '../../hooks/useUsers';
import GoogleSignIn from '../Auth/GoogleSignIn';
import { checkUploadQuota, cleanupOldPhotos, updateProjectStorage } from '../../utils/storageQuota';
import StorageIndicator from '../User/StorageIndicator';

const Header = () => {
    const { user } = useAuth();
    const { updateUserProfile } = useUsers(user?.uid);
    const [isEditingName, setIsEditingName] = useState(false);
    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [isUpdating, setIsUpdating] = useState(false);
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    const handleSaveName = async () => {
        if (!displayName.trim()) {
            setError('Name cannot be empty');
            return;
        }

        setIsUpdating(true);
        setError('');

        try {
            // Update Firebase Auth profile
            await updateProfile(user, {
                displayName: displayName.trim()
            });
            
            // Update Firestore and propagate to followers
            await updateUserProfile(user.uid, {
                displayName: displayName.trim(),
                email: user.email,
                photoURL: user.photoURL,
            });
            
            setIsEditingName(false);
        } catch (err) {
            console.error('Error updating display name:', err);
            setError('Failed to update name');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleCancelEdit = () => {
        setDisplayName(user?.displayName || '');
        setIsEditingName(false);
        setError('');
    };

    const handleStartEdit = () => {
        setDisplayName(user?.displayName || '');
        setIsEditingName(true);
    };

    const handlePhotoUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Check for HEIC/HEIF files (iOS format)
        const fileName = file.name.toLowerCase();
        if (fileName.endsWith('.heic') || fileName.endsWith('.heif')) {
            setError('HEIC format not supported. Please convert to JPG/PNG first or use your phone\'s camera settings to save as JPG.');
            return;
        }

        // Validate file type - be more specific about supported formats
        const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!supportedTypes.includes(file.type.toLowerCase())) {
            setError('Please select a JPG, PNG, GIF, or WebP image');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('Image must be less than 5MB');
            return;
        }

        setIsUploadingPhoto(true);
        setError('');

        try {
            // Check quota before uploading (now includes project-wide check)
            const quotaCheck = await checkUploadQuota(user.uid, file.size);
            
            if (!quotaCheck.canUpload) {
                setError(quotaCheck.reason);
                setIsUploadingPhoto(false);
                return;
            }

            // Cleanup old photos before uploading new one
            try {
                const cleanup = await cleanupOldPhotos(user.uid, 5);
                console.log(`Cleaned up ${cleanup.deleted} files, freed ${cleanup.bytesFreed} bytes`);
            } catch (cleanupError) {
                console.warn('Failed to cleanup old photos:', cleanupError);
            }

            // Create a unique filename with proper extension
            const timestamp = Date.now();
            const fileExtension = file.type.split('/')[1];
            const fileNamePath = `profile-photos/${user.uid}/${timestamp}.${fileExtension}`;
            const storageRef = ref(storage, fileNamePath);

            // Set metadata for better handling
            const metadata = {
                contentType: file.type,
                customMetadata: {
                    uploadedBy: user.uid,
                    uploadedAt: new Date().toISOString(),
                    fileSize: file.size.toString(),
                }
            };

            // Upload the file with metadata
            await uploadBytes(storageRef, file, metadata);
            
            // ✅ IMPORTANT: Update project storage counter after successful upload
            await updateProjectStorage(file.size);

            // Get the download URL
            const photoURL = await getDownloadURL(storageRef);

            // Update Firebase Auth profile
            await updateProfile(user, {
                photoURL: photoURL
            });

            // Update Firestore and propagate to followers
            await updateUserProfile(user.uid, {
                displayName: user.displayName,
                email: user.email,
                photoURL: photoURL,
            });

        } catch (err) {
            console.error('Error uploading photo:', err);
            setError('Failed to upload photo. Please try again.');
        } finally {
            setIsUploadingPhoto(false);
        }
    };

    const handlePhotoClick = () => {
        if (!isUploadingPhoto) {
            fileInputRef.current?.click();
        }
    };

    return (
        <header className="bg-slate-900/95 backdrop-blur-md p-4 text-white shadow-lg border-b border-slate-700/50">
            <div className="container mx-auto flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        Recipe Vibe
                    </h1>
                    {/* DEBUG: Storage Indicator */}
                    <StorageIndicator />
                </div>
                
                <div className="flex items-center space-x-4">
                    {/* Profile Photo Section */}
                    <div className="profile-photo-section">
                        <div className="profile-photo-wrapper" onClick={handlePhotoClick}>
                            {isUploadingPhoto ? (
                                <div className="profile-photo-loading">
                                    <svg className="spinner-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <circle cx="12" cy="12" r="10" strokeWidth="3" strokeOpacity="0.25"></circle>
                                        <path d="M12 2a10 10 0 0 1 10 10" strokeWidth="3" strokeLinecap="round"></path>
                                    </svg>
                                </div>
                            ) : user.photoURL ? (
                                <img src={user.photoURL} alt={user.displayName} className="profile-photo-img" />
                            ) : (
                                <div className="profile-photo-placeholder">
                                    {user.displayName?.charAt(0).toUpperCase() || 'U'}
                                </div>
                            )}
                            <div className="profile-photo-overlay">
                                <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M10.5 8.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"></path>
                                    <path d="M2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828.828A2 2 0 0 1 3.172 4H2zm.5 2a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1zm9 2.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0z"></path>
                                </svg>
                            </div>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                            onChange={handlePhotoUpload}
                            style={{ display: 'none' }}
                        />
                    </div>

                    <div className="header-user-section">
                        {isEditingName ? (
                            <div className="name-edit-wrapper">
                                <div className="name-edit-inner">
                                    <input
                                        type="text"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleSaveName();
                                            if (e.key === 'Escape') handleCancelEdit();
                                        }}
                                        className="name-input-field"
                                        placeholder="Your name"
                                        autoFocus
                                        disabled={isUpdating}
                                    />
                                    <div className="name-edit-buttons">
                                        <button
                                            onClick={handleSaveName}
                                            disabled={isUpdating}
                                            className="name-save-btn"
                                            title="Save name (Enter)"
                                        >
                                            {isUpdating ? (
                                                <svg className="spinner-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                    <circle cx="12" cy="12" r="10" strokeWidth="3" strokeOpacity="0.25"></circle>
                                                    <path d="M12 2a10 10 0 0 1 10 10" strokeWidth="3" strokeLinecap="round"></path>
                                                </svg>
                                            ) : (
                                                <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                                                    <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"></path>
                                                </svg>
                                            )}
                                        </button>
                                        <button
                                            onClick={handleCancelEdit}
                                            disabled={isUpdating}
                                            className="name-cancel-btn"
                                            title="Cancel (Esc)"
                                        >
                                            <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                                                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"></path>
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                {error && (
                                    <div className="name-error-message">
                                        <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                                            <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"></path>
                                        </svg>
                                        <span>{error}</span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="name-display-wrapper" onClick={handleStartEdit}>
                                <div className="user-info">
                                    <p className="user-display-name">{user.displayName || 'User'}</p>
                                    <p className="user-email">{user.email}</p>
                                </div>
                                <div className="edit-name-trigger">
                                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                        <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708L10.5 8.207l-3-3L12.146.146ZM11.207 9l-3-3L2.5 11.707V14.5a.5.5 0 0 0 .5.5h2.793L11.207 9ZM1 11.5a.5.5 0 0 1 .5-.5H2v-.793L8.146 4.561l3 3L5 13.707V14.5a1.5 1.5 0 0 1-1.5 1.5H1.5A1.5 1.5 0 0 1 0 14.5v-3Z"></path>
                                    </svg>
                                </div>
                            </div>
                        )}
                    </div>
                    <GoogleSignIn />
                </div>
            </div>
            {error && !isEditingName && (
                <div className="header-error-toast">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"></path>
                    </svg>
                    <span>{error}</span>
                    <button onClick={() => setError('')}>
                        <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"></path>
                        </svg>
                    </button>
                </div>
            )}
        </header>
    );
};

export default Header;