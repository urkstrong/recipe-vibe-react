import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { firebaseApp, db } from '../services/firebase';
import { doc, setDoc } from 'firebase/firestore';

const AuthContext = createContext({
    user: null,
    loading: true,
    signInWithGoogle: () => {},
    signOutUser: () => {}
});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const auth = getAuth(firebaseApp);

    const syncUserToFirestore = async (user) => {
        if (!user) return;
        
        try {
            const userPath = `/artifacts/${process.env.REACT_APP_FIREBASE_APP_ID}/users/${user.uid}`;
            await setDoc(doc(db, userPath), {
                displayName: user.displayName || 'Anonymous',
                email: user.email,
                photoURL: user.photoURL || null,
                lastActive: new Date(),
                uid: user.uid,
            }, { merge: true });
            console.log('User synced to Firestore:', user.uid);
        } catch (error) {
            console.error('Error syncing user to Firestore:', error);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user);
            setLoading(false);
            if (user) {
                await syncUserToFirestore(user);
            }
        });
        return () => unsubscribe();
    }, [auth]);

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        // Add prompt parameter to ensure popup shows
        provider.setCustomParameters({
            prompt: 'select_account'
        });

        try {
            const result = await signInWithPopup(auth, provider);
            await syncUserToFirestore(result.user);
            return { success: true };
        } catch (error) {
            console.error("Google Sign-In Error:", error);
            
            // Handle specific error cases
            if (error.code === 'auth/popup-closed-by-user') {
                console.log('User closed the popup');
                return { success: false, error: 'Sign-in cancelled' };
            } else if (error.code === 'auth/popup-blocked') {
                console.log('Popup was blocked');
                return { success: false, error: 'Popup blocked by browser' };
            } else if (error.code === 'auth/cancelled-popup-request') {
                console.log('Multiple popup requests');
                return { success: false, error: 'Please try again' };
            }
            
            return { success: false, error: error.message };
        }
    };

    const signOutUser = async () => {
        try {
            await signOut(auth);
            return { success: true };
        } catch (error) {
            console.error("Sign Out Error:", error);
            return { success: false, error: error.message };
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOutUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};

export { AuthContext };