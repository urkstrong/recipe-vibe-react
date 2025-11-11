import { useEffect, useState } from 'react';
import { db } from '../services/firebase';
import { collection, addDoc, deleteDoc, doc, onSnapshot, updateDoc, getDoc } from 'firebase/firestore';
import { deleteRecipeImage } from '../utils/storageQuota';

const useRecipes = (userId) => {
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
        console.log('Fetching recipes from path:', recipeCollectionPath);
        const recipesCol = collection(db, recipeCollectionPath);

        const unsubscribe = onSnapshot(recipesCol, (snapshot) => {
            console.log('Snapshot received, size:', snapshot.size);
            setLoading(false);
            setError(null);
            
            if (snapshot.empty) {
                console.log('No recipes found');
                setRecipes([]);
            } else {
                const fetchedRecipes = snapshot.docs.map(doc => {
                    const data = doc.data();
                    console.log('Recipe data:', data);
                    return { id: doc.id, ...data };
                });
                
                // Fix sorting - handle both Firestore timestamps and Date objects
                fetchedRecipes.sort((a, b) => {
                    const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
                    const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
                    return bDate - aDate;
                });
                
                console.log('Sorted recipes:', fetchedRecipes);
                setRecipes(fetchedRecipes);
            }
        }, (error) => {
            console.error('Error fetching recipes:', error);
            setLoading(false);
            setError(error);
        });

        return () => unsubscribe();
    }, [userId]);

    const addRecipe = async (recipe) => {
        if (!userId) {
            throw new Error("User not authenticated");
        }

        const recipeCollectionPath = `/artifacts/${process.env.REACT_APP_FIREBASE_APP_ID}/users/${userId}/recipes`;
        await addDoc(collection(db, recipeCollectionPath), {
            ...recipe,
            createdAt: new Date(),
            userId: userId,
        });
    };

    const deleteRecipe = async (id) => {
        if (!userId) {
            throw new Error("User not authenticated");
        }

        const docPath = `/artifacts/${process.env.REACT_APP_FIREBASE_APP_ID}/users/${userId}/recipes/${id}`;
        
        // Get recipe data to find image URL
        try {
            const recipeDoc = await getDoc(doc(db, docPath));
            if (recipeDoc.exists()) {
                const recipeData = recipeDoc.data();
                
                // Delete image from storage if it exists
                if (recipeData.imageUrl) {
                    await deleteRecipeImage(recipeData.imageUrl);
                }
            }
        } catch (error) {
            console.error('Error deleting recipe image:', error);
            // Continue with recipe deletion even if image deletion fails
        }

        // Delete recipe document
        await deleteDoc(doc(db, docPath));
    };

    const updateRecipe = async (id, updatedData) => {
        if (!userId) {
            throw new Error("User not authenticated");
        }

        const docPath = `/artifacts/${process.env.REACT_APP_FIREBASE_APP_ID}/users/${userId}/recipes/${id}`;
        await updateDoc(doc(db, docPath), updatedData);
    };

    return { recipes, loading, error, addRecipe, deleteRecipe, updateRecipe };
};

export default useRecipes;