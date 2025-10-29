
import React, { useState, useEffect } from 'react';

const Clock: React.FC = () => {
    const [date, setDate] = useState(new Date());

    useEffect(() => {
        const timerId = setInterval(() => setDate(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);

    const timeOptions: Intl.DateTimeFormatOptions = {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
    };

    const dateOptions: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    };

    const timeString = date.toLocaleTimeString('es-419', timeOptions);
    const dateString = date.toLocaleDateString('es-419', dateOptions);

    return (
        <div className="flex flex-col items-end">
            <div className="font-bold text-lg">{timeString}</div>
            <div className="text-xs capitalize">{dateString}</div>
        </div>
    );
};

export default Clock;
