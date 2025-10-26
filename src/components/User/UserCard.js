import React from 'react';
import { useNavigate } from 'react-router-dom';

const UserCard = ({ user, isFollowing, onFollow, onUnfollow }) => {
    const navigate = useNavigate();

    const handleToggleFollow = (e) => {
        e.stopPropagation();
        if (isFollowing) {
            onUnfollow(user.id);
        } else {
            onFollow(user.id, user);
        }
    };

    const handleViewProfile = () => {
        navigate(`/user/${user.id}`);
    };

    return (
        <div className="user-card" onClick={handleViewProfile}>
            <div className="user-card-header">
                <div className="user-avatar">
                    {user.photoURL ? (
                        <img src={user.photoURL} alt={user.displayName} />
                    ) : (
                        <div className="user-avatar-placeholder">
                            {user.displayName?.charAt(0).toUpperCase() || 'U'}
                        </div>
                    )}
                </div>
                <div className="user-card-info">
                    <h3>{user.displayName || 'Anonymous User'}</h3>
                    <p>{user.email}</p>
                </div>
            </div>
            <button
                onClick={handleToggleFollow}
                className={`follow-btn ${isFollowing ? 'following' : ''}`}
            >
                {isFollowing ? (
                    <>
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
                        </svg>
                        Following
                    </>
                ) : (
                    <>
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                        </svg>
                        Follow
                    </>
                )}
            </button>
        </div>
    );
};

export default UserCard;
