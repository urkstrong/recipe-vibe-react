import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import useUserRecipes from '../../hooks/useUserRecipes';
import useUsers from '../../hooks/useUsers';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import LoadingState from '../UI/LoadingState';
import RecipeCard from '../Recipe/RecipeCard';
import useFavorites from '../../hooks/useFavorites';

const UserProfile = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const { recipes, loading: recipesLoading } = useUserRecipes(userId);
    const { following, followUser, unfollowUser } = useUsers(currentUser?.uid);
    const { favoriteRecipes: userFavorites, loading: favoritesLoading, getUserTotalFavorites } = useFavorites(userId);
    const [profileUser, setProfileUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [totalFavoritesReceived, setTotalFavoritesReceived] = useState(0);

    const isFollowing = following.includes(userId);
    const isOwnProfile = currentUser?.uid === userId;

    console.log('UserProfile - userId:', userId, 'recipes:', recipes, 'loading:', recipesLoading);

    useEffect(() => {
        const fetchUserProfile = async () => {
            if (!userId) return;
            
            try {
                const userPath = `/artifacts/${process.env.REACT_APP_FIREBASE_APP_ID}/users/${userId}`;
                console.log('Fetching user profile from:', userPath);
                const userDoc = await getDoc(doc(db, userPath));
                
                if (userDoc.exists()) {
                    const userData = { id: userDoc.id, ...userDoc.data() };
                    console.log('User profile found:', userData);
                    setProfileUser(userData);
                } else {
                    console.log('User profile not found');
                }
            } catch (error) {
                console.error('Error fetching user profile:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserProfile();
    }, [userId]);

    useEffect(() => {
        const loadTotalFavorites = async () => {
            if (userId && getUserTotalFavorites) {
                const total = await getUserTotalFavorites(userId);
                setTotalFavoritesReceived(total);
            }
        };
        loadTotalFavorites();
    }, [userId, getUserTotalFavorites]);

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
                        <span className="stat-item">
                            <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16" className="stat-icon">
                                <path d="M3 2.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5v-1zm0 3a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5v-1zm0 3a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5v-1zm0 3a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5v-1z"/>
                            </svg>
                            <span>{recipes.length} {recipes.length === 1 ? 'Recipe' : 'Recipes'}</span>
                        </span>
                        <span className="stat-item">
                            <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16" className="stat-icon">
                                <path fillRule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314z"/>
                            </svg>
                            <span>{totalFavoritesReceived} {totalFavoritesReceived === 1 ? 'Favorite' : 'Favorites'}</span>
                        </span>
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
                            <RecipeCard
                                key={recipe.id}
                                recipe={recipe}
                                showFavorite={true}
                                recipeOwnerId={userId}
                                ownerName={profileUser.displayName}
                                readOnly={!isOwnProfile}
                                onDelete={isOwnProfile ? undefined : undefined}
                                onUpdate={isOwnProfile ? undefined : undefined}
                            />
                        ))}
                    </div>
                )}
            </div>

            {userFavorites.length > 0 && (
                <div className="user-profile-recipes" style={{ marginTop: '3rem' }}>
                    <h2 className="text-2xl font-bold text-white mb-6">
                        {isOwnProfile ? 'Your Favorites' : `${profileUser.displayName}'s Favorites`}
                    </h2>
                    
                    {favoritesLoading ? (
                        <LoadingState />
                    ) : (
                        <div className="recipe-grid">
                            {userFavorites.map(recipe => (
                                <RecipeCard
                                    key={recipe.id}
                                    recipe={recipe}
                                    showFavorite={true}
                                    recipeOwnerId={recipe.ownerId}
                                    ownerName={recipe.ownerName}
                                    readOnly={true}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default UserProfile;
