import { useEffect, useState } from 'react';
import { db } from '../services/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

const useUserRecipes = (userId) => {
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!userId) {
            setRecipes([]);
            setLoading(false);
            return;
        }

        const recipeCollectionPath = `/artifacts/${process.env.REACT_APP_FIREBASE_APP_ID}/users/${userId}/recipes`;
        const recipesCol = collection(db, recipeCollectionPath);

        const unsubscribe = onSnapshot(recipesCol, (snapshot) => {
            setLoading(false);
            setError(null);
            
            if (snapshot.empty) {
                setRecipes([]);
            } else {
                const fetchedRecipes = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                
                fetchedRecipes.sort((a, b) => {
                    const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
                    const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
                    return bDate - aDate;
                });
                
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
