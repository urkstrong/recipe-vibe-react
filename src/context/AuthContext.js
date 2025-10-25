import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { firebaseApp } from '../services/firebase';

const AuthContext = createContext({
    user: null,
    signInWithGoogle: () => {},
    signOutUser: () => {}
});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const auth = getAuth(firebaseApp);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
        });
        return () => unsubscribe();
    }, [auth]);

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