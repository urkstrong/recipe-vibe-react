import { useEffect, useState } from 'react';
import { db } from '../services/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';

const useUserRecipes = (userId) => {
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        console.log('useUserRecipes - userId:', userId);
        
        if (!userId) {
            console.log('No userId provided');
            setRecipes([]);
            setLoading(false);
            return;
        }

        const recipeCollectionPath = `/artifacts/${process.env.REACT_APP_FIREBASE_APP_ID}/users/${userId}/recipes`;
        console.log('Fetching recipes from path:', recipeCollectionPath);
        
        const recipesCol = collection(db, recipeCollectionPath);
        const recipesQuery = query(recipesCol);

        const unsubscribe = onSnapshot(recipesQuery, (snapshot) => {
            console.log('Snapshot received for user:', userId, 'Size:', snapshot.size);
            setLoading(false);
            setError(null);
            
            if (snapshot.empty) {
                console.log('No recipes found for user:', userId);
                setRecipes([]);
            } else {
                const fetchedRecipes = snapshot.docs.map(doc => {
                    const data = doc.data();
                    console.log('Recipe found:', doc.id, data);
                    return {
                        id: doc.id,
                        ...data
                    };
                });
                
                fetchedRecipes.sort((a, b) => {
                    const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
                    const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
                    return bDate - aDate;
                });
                
                console.log('Setting recipes:', fetchedRecipes.length, 'recipes');
                setRecipes(fetchedRecipes);
            }
        }, (error) => {
            console.error('Error fetching user recipes:', error);
            setLoading(false);
            setError(error);
        });

        return () => unsubscribe();
    }, [userId]);

    return { recipes, loading, error };
};

export default useUserRecipes;
