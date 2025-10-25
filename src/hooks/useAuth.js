import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { firebaseApp } from '../services/firebase';

const auth = getAuth(firebaseApp);

const useAuth = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Google Sign-In Error:", error);
        }
    };

    const signOutUser = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Sign Out Error:", error);
        }
    };

    return {
        user,
        loading,
        signInWithGoogle,
        signOutUser,
    };
};

export { useAuth };