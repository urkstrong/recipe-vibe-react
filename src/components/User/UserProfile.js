import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import useUserRecipes from '../../hooks/useUserRecipes';
import useUsers from '../../hooks/useUsers';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import LoadingState from '../UI/LoadingState';

const UserProfile = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const { recipes, loading: recipesLoading } = useUserRecipes(userId);
    const { following, followUser, unfollowUser } = useUsers(currentUser?.uid);
    const [profileUser, setProfileUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const isFollowing = following.includes(userId);
    const isOwnProfile = currentUser?.uid === userId;

    useEffect(() => {
        const fetchUserProfile = async () => {
            if (!userId) return;
            
            try {
                const userPath = `/artifacts/${process.env.REACT_APP_FIREBASE_APP_ID}/users/${userId}`;
                const userDoc = await getDoc(doc(db, userPath));
                
                if (userDoc.exists()) {
                    setProfileUser({ id: userDoc.id, ...userDoc.data() });
                }
            } catch (error) {
                console.error('Error fetching user profile:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserProfile();
    }, [userId]);

    const handleToggleFollow = () => {
        if (isFollowing) {
            unfollowUser(userId);
        } else {
            followUser(userId, profileUser);
        }
    };

    if (loading || recipesLoading) {
        return <LoadingState />;
    }

    if (!profileUser) {
        return (
            <div className="text-center p-12">
                <h2 className="text-2xl font-bold text-slate-300 mb-4">User Not Found</h2>
                <button onClick={() => navigate('/users')} className="text-blue-400 hover:text-blue-300">
                    ← Back to Users
                </button>
            </div>
        );
    }

    return (
        <div className="user-profile-container">
            <button onClick={() => navigate(-1)} className="back-button">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                    <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
                </svg>
                Back
            </button>

            <div className="user-profile-header">
                <div className="user-profile-avatar">
                    {profileUser.photoURL ? (
                        <img src={profileUser.photoURL} alt={profileUser.displayName} />
                    ) : (
                        <div className="user-profile-avatar-placeholder">
                            {profileUser.displayName?.charAt(0).toUpperCase() || 'U'}
                        </div>
                    )}
                </div>
                <div className="user-profile-info">
                    <h1>{profileUser.displayName || 'Anonymous User'}</h1>
                    <p>{profileUser.email}</p>
                    <div className="user-profile-stats">
                        <span>{recipes.length} {recipes.length === 1 ? 'Recipe' : 'Recipes'}</span>
                    </div>
                </div>
                {!isOwnProfile && (
                    <button
                        onClick={handleToggleFollow}
                        className={`profile-follow-btn ${isFollowing ? 'following' : ''}`}
                    >
                        {isFollowing ? 'Unfollow' : 'Follow'}
                    </button>
                )}
            </div>

            <div className="user-profile-recipes">
                <h2 className="text-2xl font-bold text-white mb-6">
                    {isOwnProfile ? 'Your Recipes' : `${profileUser.displayName}'s Recipes`}
                </h2>
                
                {recipes.length === 0 ? (
                    <div className="text-center p-12">
                        <p className="text-slate-400">No recipes yet</p>
                    </div>
                ) : (
                    <div className="recipe-grid">
                        {recipes.map(recipe => (
                            <div key={recipe.id} className="recipe-card view-only">
                                <h3 className="text-xl font-bold text-white mb-4">{recipe.name}</h3>
                                <div className="mb-4">
                                    <h4 className="text-xs font-semibold text-blue-400 mb-2 uppercase tracking-wide">Ingredients</h4>
                                    <p className="text-slate-300 text-sm leading-relaxed">
                                        {recipe.ingredients}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-semibold text-blue-400 mb-2 uppercase tracking-wide">Instructions</h4>
                                    <p className="text-slate-300 text-sm leading-relaxed">
                                        {recipe.instructions}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserProfile;
