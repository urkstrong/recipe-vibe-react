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
                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="stat-icon">
                                <path d="M10.5 8.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/>
                                <path d="M2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828.828A2 2 0 0 1 3.172 4H2zm.5 2a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1zm9 2.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0z"/>
                            </svg>
                            {recipes.length} {recipes.length === 1 ? 'Recipe' : 'Recipes'}
                        </span>
                        <span className="stat-item">
                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" className="stat-icon">
                                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            {totalFavoritesReceived} {totalFavoritesReceived === 1 ? 'Favorite' : 'Favorites'}
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
