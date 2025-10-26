import { useEffect, useState } from 'react';
import { db } from '../services/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, where, getDocs, writeBatch } from 'firebase/firestore';

const useUsers = (currentUserId) => {
    const [users, setUsers] = useState([]);
    const [following, setFollowing] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch all users
    useEffect(() => {
        if (!currentUserId) {
            console.log('useUsers: No currentUserId provided');
            setUsers([]);
            setLoading(false);
            return;
        }

        const usersPath = `/artifacts/${process.env.REACT_APP_FIREBASE_APP_ID}/users`;
        console.log('useUsers: Fetching from path:', usersPath);
        const usersCol = collection(db, usersPath);

        const unsubscribe = onSnapshot(usersCol, (snapshot) => {
            console.log('useUsers: Snapshot received, size:', snapshot.size);
            setLoading(false);
            setError(null);
            
            const fetchedUsers = snapshot.docs
                .map(doc => {
                    const data = { id: doc.id, ...doc.data() };
                    console.log('useUsers: User data:', data);
                    return data;
                })
                .filter(user => user.id !== currentUserId);
            
            console.log('useUsers: Filtered users (excluding current):', fetchedUsers);
            setUsers(fetchedUsers);
        }, (error) => {
            console.error('useUsers: Error fetching users:', error);
            setLoading(false);
            setError(error);
        });

        return () => unsubscribe();
    }, [currentUserId]);

    // Fetch following list
    useEffect(() => {
        if (!currentUserId) {
            setFollowing([]);
            return;
        }

        const followingPath = `/artifacts/${process.env.REACT_APP_FIREBASE_APP_ID}/users/${currentUserId}/following`;
        console.log('useUsers: Fetching following from:', followingPath);
        const followingCol = collection(db, followingPath);

        const unsubscribe = onSnapshot(followingCol, (snapshot) => {
            const followingIds = snapshot.docs.map(doc => doc.id);
            console.log('useUsers: Following IDs:', followingIds);
            setFollowing(followingIds);
        }, (error) => {
            console.error('useUsers: Error fetching following:', error);
        });

        return () => unsubscribe();
    }, [currentUserId]);

    const followUser = async (targetUserId, targetUserData) => {
        if (!currentUserId) throw new Error("User not authenticated");

        const followingPath = `/artifacts/${process.env.REACT_APP_FIREBASE_APP_ID}/users/${currentUserId}/following/${targetUserId}`;
        console.log('useUsers: Following user at:', followingPath);
        await setDoc(doc(db, followingPath), {
            userId: targetUserId,
            displayName: targetUserData.displayName,
            email: targetUserData.email,
            photoURL: targetUserData.photoURL || null,
            followedAt: new Date(),
        });
    };

    const unfollowUser = async (targetUserId) => {
        if (!currentUserId) throw new Error("User not authenticated");

        const followingPath = `/artifacts/${process.env.REACT_APP_FIREBASE_APP_ID}/users/${currentUserId}/following/${targetUserId}`;
        console.log('useUsers: Unfollowing user at:', followingPath);
        await deleteDoc(doc(db, followingPath));
    };

    const updateUserProfile = async (userId, userData) => {
        if (!userId) throw new Error("User ID required");

        // Update main user document
        const userPath = `/artifacts/${process.env.REACT_APP_FIREBASE_APP_ID}/users/${userId}`;
        await setDoc(doc(db, userPath), {
            displayName: userData.displayName,
            email: userData.email,
            photoURL: userData.photoURL || null,
            lastActive: new Date(),
        }, { merge: true });

        // Update cached data in all followers' following collections
        // This ensures followers see the updated name
        try {
            const allUsersPath = `/artifacts/${process.env.REACT_APP_FIREBASE_APP_ID}/users`;
            const allUsersSnapshot = await getDocs(collection(db, allUsersPath));
            
            const batch = writeBatch(db);
            let updateCount = 0;

            for (const userDoc of allUsersSnapshot.docs) {
                const followingDocPath = `${allUsersPath}/${userDoc.id}/following/${userId}`;
                const followingDocRef = doc(db, followingDocPath);
                
                // Check if this user is following the updated user
                const followingDocSnap = await getDocs(collection(db, `${allUsersPath}/${userDoc.id}/following`));
                const isFollowing = followingDocSnap.docs.some(d => d.id === userId);
                
                if (isFollowing) {
                    batch.update(followingDocRef, {
                        displayName: userData.displayName,
                        email: userData.email,
                        photoURL: userData.photoURL || null,
                    });
                    updateCount++;
                }
            }

            if (updateCount > 0) {
                await batch.commit();
                console.log(`Updated profile in ${updateCount} followers' collections`);
            }
        } catch (error) {
            console.error('Error updating cached profile data:', error);
            // Don't throw - main profile update succeeded
        }
    };

    return { users, following, loading, error, followUser, unfollowUser, updateUserProfile };
};

export default useUsers;
