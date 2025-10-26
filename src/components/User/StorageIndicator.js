import React, { useEffect, useState } from 'react';
import { getProjectStorageUsage, formatBytes, STORAGE_LIMITS, recalculateProjectStorage } from '../../utils/storageQuota';

const StorageIndicator = () => {
    const [projectBytes, setProjectBytes] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isRecalculating, setIsRecalculating] = useState(false);

    const fetchStorageUsage = async () => {
        try {
            const bytes = await getProjectStorageUsage();
            setProjectBytes(bytes);
        } catch (error) {
            console.error('Error fetching storage usage:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStorageUsage();
        
        // Refresh every 10 seconds
        const interval = setInterval(fetchStorageUsage, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleRecalculate = async () => {
        setIsRecalculating(true);
        try {
            const result = await recalculateProjectStorage();
            setProjectBytes(result.totalBytes);
            console.log('Recalculation complete:', result);
        } catch (error) {
            console.error('Failed to recalculate:', error);
        } finally {
            setIsRecalculating(false);
        }
    };

    if (loading) {
        return (
            <div className="storage-indicator-debug">
                <span className="text-xs">Loading...</span>
            </div>
        );
    }

    const percentage = (projectBytes / STORAGE_LIMITS.FREE_TIER_TOTAL) * 100;
    const isWarning = percentage > 75;
    const isDanger = percentage > 90;

    return (
        <div className={`storage-indicator-debug ${isDanger ? 'danger' : isWarning ? 'warning' : ''}`}>
            <div className="storage-info">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M3 2.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5v-1zM2 4h12v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4zm1 0v9h10V4H3z"/>
                    <path d="M5 6h6v1H5V6zm0 2h6v1H5V8z"/>
                </svg>
                <div className="storage-details">
                    <span className="storage-text">
                        {formatBytes(projectBytes)} / {formatBytes(STORAGE_LIMITS.FREE_TIER_TOTAL)}
                    </span>
                    <div className="storage-bar">
                        <div className="storage-bar-fill" style={{ width: `${Math.min(percentage, 100)}%` }}></div>
                    </div>
                </div>
            </div>
            <span className="storage-percentage">{percentage.toFixed(1)}%</span>
            <button 
                onClick={handleRecalculate}
                disabled={isRecalculating}
                className="storage-recalc-btn"
                title="Recalculate actual storage usage"
            >
                {isRecalculating ? (
                    <svg className="spinner-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="12" cy="12" r="10" strokeWidth="3" strokeOpacity="0.25"/>
                        <path d="M12 2a10 10 0 0 1 10 10" strokeWidth="3" strokeLinecap="round"/>
                    </svg>
                ) : (
                    <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                        <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
                        <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
                    </svg>
                )}
            </button>
        </div>
    );
};

export default StorageIndicator;
