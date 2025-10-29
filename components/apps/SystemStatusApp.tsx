import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const generateData = () => {
    return Array.from({ length: 10 }, (_, i) => ({
        time: i,
        cpu: Math.random() * 80 + 10,
        memory: Math.random() * 60 + 20,
        network: Math.random() * 90 + 5,
    }));
};

const SystemStatusApp: React.FC = () => {
    const [data, setData] = useState(generateData());

    useEffect(() => {
        const interval = setInterval(() => {
            setData(prevData => {
                const newDataPoint = {
                    time: (prevData[prevData.length - 1]?.time || 0) + 1,
                    cpu: Math.random() * 80 + 10,
                    memory: Math.random() * 60 + 20,
                    network: Math.random() * 90 + 5,
                };
                const newDataSet = [...prevData.slice(1), newDataPoint];
                return newDataSet;
            });
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim();
    const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-color').trim();
    const backgroundRgb = getComputedStyle(document.documentElement).getPropertyValue('--background-rgb').trim();
    const primaryRgb = getComputedStyle(document.documentElement).getPropertyValue('--primary-rgb').trim();


    return (
        <div className="w-full h-full text-xs font-roboto-mono">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke={`rgba(${primaryRgb}, 0.2)`} />
                    <XAxis dataKey="time" tick={{ fill: textColor }} tickLine={{ stroke: textColor }} />
                    <YAxis unit="%" tick={{ fill: textColor }} tickLine={{ stroke: textColor }} />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: `rgba(${backgroundRgb}, 0.8)`,
                            borderColor: primaryColor,
                            color: textColor,
                        }}
                        labelStyle={{ color: primaryColor }}
                    />
                    <Legend wrapperStyle={{color: textColor}}/>
                    <Line type="monotone" dataKey="cpu" stroke={primaryColor} strokeWidth={2} dot={false} isAnimationActive={false}/>
                    <Line type="monotone" dataKey="memory" stroke={textColor} strokeOpacity={0.8} strokeWidth={2} dot={false} isAnimationActive={false}/>
                    <Line type="monotone" dataKey="network" stroke={primaryColor} strokeOpacity={0.6} strokeWidth={2} dot={false} isAnimationActive={false}/>
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default SystemStatusApp;