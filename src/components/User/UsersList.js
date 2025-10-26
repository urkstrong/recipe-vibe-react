import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import useUsers from '../../hooks/useUsers';
import UserCard from './UserCard';
import LoadingState from '../UI/LoadingState';

const UsersList = () => {
    const { user } = useAuth();
    const { users, following, loading, error, followUser, unfollowUser } = useUsers(user?.uid);
    const [filter, setFilter] = useState('all'); // 'all' or 'following'

    console.log('UsersList - Current User:', user?.uid);
    console.log('UsersList - All Users:', users);
    console.log('UsersList - Following:', following);
    console.log('UsersList - Loading:', loading);
    console.log('UsersList - Error:', error);

    const filteredUsers = filter === 'following' 
        ? users.filter(u => following.includes(u.id))
        : users;

    if (loading) {
        return <LoadingState />;
    }

    if (error) {
        return (
            <div className="text-center p-8">
                <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6 max-w-md mx-auto">
                    <h2 className="text-xl font-bold text-red-400 mb-2">Error Loading Users</h2>
                    <p className="text-red-300 text-sm">{error.message}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="users-list-container">
            <div className="users-filter-tabs">
                <button
                    onClick={() => setFilter('all')}
                    className={filter === 'all' ? 'filter-tab-active' : 'filter-tab-inactive'}
                >
                    All Users ({users.length})
                </button>
                <button
                    onClick={() => setFilter('following')}
                    className={filter === 'following' ? 'filter-tab-active' : 'filter-tab-inactive'}
                >
                    Following ({following.length})
                </button>
            </div>

            {filteredUsers.length === 0 ? (
                <div className="text-center p-12">
                    <div className="mx-auto h-24 w-24 text-slate-500 mb-6">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-full h-full">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-slate-300 mb-2">
                        {filter === 'following' ? 'Not Following Anyone Yet' : 'No Users Found'}
                    </h3>
                    <p className="text-slate-500 max-w-sm mx-auto leading-relaxed">
                        {filter === 'following' 
                            ? 'Start following other users to see their recipes!'
                            : 'Be the first to share recipes on Recipe Vibe!'}
                    </p>
                </div>
            ) : (
                <div className="users-grid">
                    {filteredUsers.map(u => (
                        <UserCard
                            key={u.id}
                            user={u}
                            isFollowing={following.includes(u.id)}
                            onFollow={followUser}
                            onUnfollow={unfollowUser}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default UsersList;
