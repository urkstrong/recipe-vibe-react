import React from 'react';

const LoadingState = () => {
    return (
        <div className="flex flex-col items-center justify-center p-12">
            <div className="relative">
                <div className="loader"></div>
            </div>
            <p className="text-slate-400 mt-4 font-medium">Loading your delicious recipes...</p>
        </div>
    );
};

export default LoadingState;