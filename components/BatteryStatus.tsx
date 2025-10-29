
import React, { useState, useEffect } from 'react';

const BatteryStatus: React.FC = () => {
    const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
    const [isCharging, setIsCharging] = useState<boolean | null>(null);

    useEffect(() => {
        let batteryManager: any = null;

        const updateBatteryStatus = () => {
            setBatteryLevel(Math.floor(batteryManager.level * 100));
            setIsCharging(batteryManager.charging);
        };

        if ('getBattery' in navigator) {
            (navigator as any).getBattery().then((bm: any) => {
                batteryManager = bm;
                updateBatteryStatus();

                batteryManager.addEventListener('levelchange', updateBatteryStatus);
                batteryManager.addEventListener('chargingchange', updateBatteryStatus);
            });
        }

        return () => {
            if (batteryManager) {
                batteryManager.removeEventListener('levelchange', updateBatteryStatus);
                batteryManager.removeEventListener('chargingchange', updateBatteryStatus);
            }
        };
    }, []);

    if (batteryLevel === null) {
        return null;
    }
    
    const getBatteryIcon = () => {
        if (isCharging) {
            return (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            );
        }
        if (batteryLevel > 90) return ""; // fa-battery-full
        if (batteryLevel > 65) return ""; // fa-battery-three-quarters
        if (batteryLevel > 40) return ""; // fa-battery-half
        if (batteryLevel > 15) return ""; // fa-battery-quarter
        return ""; // fa-battery-empty
    }

    return (
        <div className="flex items-center gap-2 text-xs">
            <span>{getBatteryIcon()}</span>
            <span>{batteryLevel}%</span>
        </div>
    );
};

export default BatteryStatus;
