import React, { useState, useEffect } from 'react';
import { RefreshCw, Users, X } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { router } from '@inertiajs/react';
import { adminClassesService, Class } from '../../../services/AdminClassesService';

const PRIMARY_COLOR_CLASS = 'bg-gradient-to-r from-purple-600 to-indigo-600';
const TEXT_COLOR_CLASS = 'text-purple-600';
const RING_COLOR_CLASS = 'focus:ring-purple-500';

interface Notification {
    type: 'success' | 'error' | 'info';
    message: string;
}

const Notification: React.FC<{ notification: Notification; onClose: () => void }> = ({ notification, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const bgColor = notification.type === 'success' 
        ? 'bg-green-600'
        : notification.type === 'error'
        ? 'bg-red-600'
        : 'bg-blue-600';

    return (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-full duration-300">
            <div className={`${bgColor} text-white px-6 py-4 rounded-xl shadow-2xl backdrop-blur-sm`}>
                <div className="flex items-center justify-between">
                    <div className="font-medium">{notification.message}</div>
                    <button onClick={onClose} className="ml-4 rounded-full p-1 hover:bg-white/20 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

const BlockchainAttendance: React.FC = () => {
    const [notification, setNotification] = useState<Notification | null>(null);
    const [loading, setLoading] = useState(false);
    const [classes, setClasses] = useState<Class[]>([]);

    const loadClasses = async () => {
        setLoading(true);
        try {
            const response = await adminClassesService.getClasses({ per_page: 9999 });
            if (response.success) {
                setClasses(response.data || []);
            } else {
                setNotification({ type: 'error', message: response.message || 'Failed to load classes' });
            }
        } catch (error: any) {
            setNotification({ type: 'error', message: error.message || 'Failed to load classes' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadClasses();
    }, []);

    return (
        <AppLayout>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-900">
                <div className="container mx-auto px-4 py-8">
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                                    Blockchain Attendance
                                </h1>
                                <p className="text-gray-600 dark:text-white">View student attendance by class</p>
                            </div>
                            <button
                                onClick={loadClasses}
                                className="flex items-center px-4 py-2 bg-gray-200 dark:bg-gray-800 dark:border-white dark:text-white text-gray-700 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-700 transition-all cursor-pointer border dark:border-white"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Refresh
                            </button>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 dark:border-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-white">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <RefreshCw className={`h-8 w-8 ${TEXT_COLOR_CLASS} animate-spin`} />
                            </div>
                        ) : classes.length === 0 ? (
                            <div className="px-6 py-12 text-center text-gray-500 dark:text-white">
                                No classes found
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-200 dark:divide-white">
                                {classes.map((classItem) => (
                                    <div key={classItem.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{classItem.class_code}</h3>
                                                <p className="text-sm text-gray-600 dark:text-white mt-1">{classItem.class_name}</p>
                                                <p className="text-xs text-gray-500 dark:text-white mt-1">
                                                    {classItem.student_count || 0} students
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => router.visit(`/admin/blockchain-transactions/attendance/class/${classItem.id}/students`)}
                                                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors cursor-pointer"
                                            >
                                                <Users className="w-4 h-4 mr-2" />
                                                View Students
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {notification && (
                        <Notification
                            notification={notification}
                            onClose={() => setNotification(null)}
                        />
                    )}
                </div>
            </div>
        </AppLayout>
    );
};

export default BlockchainAttendance;

