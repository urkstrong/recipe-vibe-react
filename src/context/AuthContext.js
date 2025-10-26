import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { firebaseApp, db } from '../services/firebase';
import { doc, setDoc } from 'firebase/firestore';

const AuthContext = createContext({
    user: null,
    signInWithGoogle: () => {},
    signOutUser: () => {}
});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
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
                uid: user.uid, // Store UID explicitly for easier querying
            }, { merge: true });
            console.log('User synced to Firestore:', user.uid);
        } catch (error) {
            console.error('Error syncing user to Firestore:', error);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user);
            if (user) {
                await syncUserToFirestore(user);
            }
        });
        return () => unsubscribe();
    }, [auth]);

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            await syncUserToFirestore(result.user);
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

    return (
        <AuthContext.Provider value={{ user, signInWithGoogle, signOutUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};

export { AuthContext };