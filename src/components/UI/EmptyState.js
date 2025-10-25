import React from 'react';

const EmptyState = () => {
    return (
        <div className="text-center p-12">
            <div className="mx-auto h-24 w-24 text-slate-500 mb-6">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-full h-full">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-300 mb-2">No Recipes Yet</h3>
            <p className="text-slate-500 max-w-sm mx-auto leading-relaxed">
                Start building your collection of delicious recipes! Add your first recipe using the form on the left.
            </p>
        </div>
    );
};

export default EmptyState;