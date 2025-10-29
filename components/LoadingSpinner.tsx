import React from 'react';

const LoadingSpinner: React.FC = () => {
    return (
        <div className="flex justify-center items-center h-full w-full">
            <div 
                className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2"
                style={{
                    borderColor: 'var(--primary-color)'
                }}
            ></div>
        </div>
    );
};

export default LoadingSpinner;