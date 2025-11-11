import { useEffect, useState } from 'react';
import { db } from '../services/firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, getDoc, getDocs, query, collectionGroup, where } from 'firebase/firestore';

const useFavorites = (userId) => {
    const [favorites, setFavorites] = useState([]);
    const [favoriteRecipes, setFavoriteRecipes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) {
            setFavorites([]);
            setFavoriteRecipes([]);
            setLoading(false);
            return;
        }

        const favoritesPath = `/artifacts/${process.env.REACT_APP_FIREBASE_APP_ID}/users/${userId}/favorites`;
        const favoritesCol = collection(db, favoritesPath);

        const unsubscribe = onSnapshot(favoritesCol, async (snapshot) => {
            const favoriteIds = snapshot.docs.map(doc => ({
                recipeId: doc.id,
                ...doc.data()
            }));
            
            setFavorites(favoriteIds);

            // Fetch full recipe details for each favorite
            const recipePromises = favoriteIds.map(async (fav) => {
                const recipePath = `/artifacts/${process.env.REACT_APP_FIREBASE_APP_ID}/users/${fav.recipeOwnerId}/recipes/${fav.recipeId}`;
                const recipeDoc = await getDoc(doc(db, recipePath));
                
                if (recipeDoc.exists()) {
                    return {
                        id: recipeDoc.id,
                        ...recipeDoc.data(),
                        ownerId: fav.recipeOwnerId,
                        ownerName: fav.ownerName,
                        favoritedAt: fav.favoritedAt
                    };
                }
                return null;
            });

            const recipes = (await Promise.all(recipePromises)).filter(r => r !== null);
            recipes.sort((a, b) => {
                const aDate = a.favoritedAt?.toDate ? a.favoritedAt.toDate() : new Date(a.favoritedAt);
                const bDate = b.favoritedAt?.toDate ? b.favoritedAt.toDate() : new Date(b.favoritedAt);
                return bDate - aDate;
            });
            
            setFavoriteRecipes(recipes);
            setLoading(false);
        }, (error) => {
            console.error('Error fetching favorites:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId]);

    const toggleFavorite = async (recipeId, recipeOwnerId, ownerName) => {
        if (!userId) return;

        const favoritePath = `/artifacts/${process.env.REACT_APP_FIREBASE_APP_ID}/users/${userId}/favorites/${recipeId}`;
        const isFavorited = favorites.some(f => f.recipeId === recipeId);

        if (isFavorited) {
            await deleteDoc(doc(db, favoritePath));
        } else {
            await setDoc(doc(db, favoritePath), {
                recipeOwnerId,
                ownerName,
                favoritedAt: new Date()
            });
        }
    };

    const isFavorited = (recipeId) => {
        return favorites.some(f => f.recipeId === recipeId);
    };

    const getRecipeFavoriteCount = async (recipeId, recipeOwnerId) => {
        try {
            // Query all favorites with this recipe ID across all users
            const favoritesQuery = query(collectionGroup(db, 'favorites'));
            const snapshot = await getDocs(favoritesQuery);
            
            // Count only favorites that match both recipe ID and owner ID
            const count = snapshot.docs.filter(docSnap => {
                const data = docSnap.data();
                return docSnap.id === recipeId && data.recipeOwnerId === recipeOwnerId;
            }).length;
            
            return count;
        } catch (error) {
            console.error('Error getting favorite count:', error);
            return 0;
        }
    };

    const getUserTotalFavorites = async (targetUserId) => {
        try {
            // Query all favorites across all users
            const favoritesQuery = query(collectionGroup(db, 'favorites'));
            const snapshot = await getDocs(favoritesQuery);
            
            // Count only favorites where this user is the recipe owner
            const count = snapshot.docs.filter(docSnap => {
                const data = docSnap.data();
                return data.recipeOwnerId === targetUserId;
            }).length;
            
            return count;
        } catch (error) {
            console.error('Error getting user total favorites:', error);
            return 0;
        }
    };

    return { 
        favorites, 
        favoriteRecipes, 
        loading, 
        toggleFavorite, 
        isFavorited,
        getRecipeFavoriteCount,
        getUserTotalFavorites
    };
};

export default useFavorites;
