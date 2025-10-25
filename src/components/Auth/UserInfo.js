import React from 'react';
import { useAuth } from '../../context/AuthContext';

const UserInfo = () => {
    const { user } = useAuth();

    if (!user) {
        return null;
    }

    return (
        <div className="user-info">
            <h2 className="text-lg font-bold">Welcome, {user.displayName || 'User'}!</h2>
            <p className="text-gray-600">Email: {user.email}</p>
        </div>
    );
};

export default UserInfo;