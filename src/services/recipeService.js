import { collection, addDoc, deleteDoc, doc, getDocs } from "firebase/firestore";
import { db } from './firebase';

const recipeCollectionPath = (appId, userId) => `/artifacts/${appId}/users/${userId}/recipes`;

export const addRecipe = async (appId, userId, recipe) => {
    if (!userId) {
        throw new Error("User not authenticated, cannot add recipe.");
    }

    try {
        await addDoc(collection(db, recipeCollectionPath(appId, userId)), recipe);
    } catch (error) {
        console.error("Error adding recipe: ", error);
        throw error;
    }
};

export const deleteRecipe = async (appId, userId, recipeId) => {
    if (!userId) return;

    try {
        await deleteDoc(doc(db, recipeCollectionPath(appId, userId), recipeId));
    } catch (error) {
        console.error("Error removing recipe: ", error);
        throw error;
    }
};

export const fetchRecipes = async (appId, userId) => {
    if (!userId) return [];

    const recipesCol = collection(db, recipeCollectionPath(appId, userId));
    const snapshot = await getDocs(recipesCol);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};