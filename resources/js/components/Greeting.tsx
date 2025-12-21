import React from 'react';
import { Sunrise, Sun, Moon } from 'lucide-react';

interface GreetingProps {
    userName?: string;
    userRole?: 'admin' | 'teacher' | 'student' | 'parent';
}

const Greeting: React.FC<GreetingProps> = ({ userName, userRole = 'admin' }) => {
    const hours = new Date().getHours();
    let greeting = 'Hello';
    let Icon = Sun;
    let iconColor = 'text-yellow-500';
    let borderColor = 'border-yellow-500';

    if (hours >= 5 && hours < 12) {
        greeting = 'Good Morning';
        Icon = Sunrise;
        iconColor = 'text-orange-500';
        borderColor = 'border-orange-500';
    } else if (hours >= 12 && hours < 18) {
        greeting = 'Good Afternoon';
        Icon = Sun;
        iconColor = 'text-yellow-600';
        borderColor = 'border-yellow-600';
    } else {
        greeting = 'Good Evening';
        Icon = Moon;
        iconColor = 'text-indigo-400';
        borderColor = 'border-indigo-400';
    }

    // Determine display name based on role
    let displayName = userName || 'User';
    
    if (!userName) {
        switch (userRole) {
            case 'admin':
                displayName = 'Administrator';
                break;
            case 'teacher':
                displayName = 'Teacher';
                break;
            case 'student':
                displayName = 'Student';
                break;
            case 'parent':
                displayName = 'Parent';
                break;
        }
    }

    return (
        <>
            <style>{`
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 15s linear infinite;
                }
            `}</style>
            <div className={`flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6 p-3 sm:p-4 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-md border-l-4 ${borderColor} animate-in fade-in duration-500`}>
                <div className={`p-1.5 sm:p-2 rounded-full ${iconColor} bg-white dark:bg-gray-700 shadow-inner`}>
                    <Icon className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 ${iconColor} animate-spin-slow`} />
                </div>
                <h2 className="text-lg sm:text-xl md:text-2xl font-extrabold text-gray-800 dark:text-gray-100">
                    {greeting}, {displayName}!
                </h2>
            </div>
        </>
    );
};

export default Greeting;

