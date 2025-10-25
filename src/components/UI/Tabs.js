import React, { useState } from 'react';

const Tabs = ({ tabs, defaultTab = 0 }) => {
    const [activeTab, setActiveTab] = useState(defaultTab);

    return (
        <div className="w-full">
            {/* Tab Headers */}
            <div className="flex space-x-1 bg-slate-800/50 p-1 rounded-xl mb-6 backdrop-blur-sm border border-slate-700/50">
                {tabs.map((tab, index) => (
                    <button
                        key={index}
                        onClick={() => setActiveTab(index)}
                        className={`flex-1 flex items-center justify-center px-6 py-3 rounded-lg font-medium ${
                            activeTab === index
                                ? 'tab-button-active'
                                : 'tab-button-inactive'
                        }`}
                    >
                        {tab.icon && (
                            <span className="mr-2">
                                {tab.icon}
                            </span>
                        )}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="tab-content">
                {tabs[activeTab] && tabs[activeTab].content}
            </div>
        </div>
    );
};

export default Tabs;
