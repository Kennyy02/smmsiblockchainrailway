import React, { useState, useEffect } from 'react';
import { RefreshCw, ArrowLeft, Eye, Users, X } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { usePage, router } from '@inertiajs/react';
import { adminClassesService, Student } from '../../../services/AdminClassesService';

const PRIMARY_COLOR_CLASS = 'bg-gradient-to-r from-purple-600 to-indigo-600';
const TEXT_COLOR_CLASS = 'text-purple-600';

interface Notification {
    type: 'success' | 'error' | 'info';
    message: string;
}

// Notification Component
const NotificationDisplay: React.FC<{ notification: Notification; onClose: () => void }> = ({ notification, onClose }) => {
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
                    <button onClick={onClose} className="ml-4 rounded-full p-1 hover:bg-white/20 transition-colors cursor-pointer">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

const BlockchainClassStudents: React.FC = () => {
    const { props } = usePage();
    const classId = (props as any).classId;
    
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState<Student[]>([]);
    const [className, setClassName] = useState('');
    const [notification, setNotification] = useState<Notification | null>(null);

    useEffect(() => {
        if (classId) {
            loadClassStudents();
        }
    }, [classId]);

    const loadClassStudents = async () => {
        setLoading(true);
        try {
            // Get class information
            const classRes = await fetch(`/api/classes/${classId}`, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
            });
            
            if (classRes.ok) {
                const classData = await classRes.json();
                if (classData.success) {
                    setClassName(classData.data.class_code || classData.data.class_name);
                }
            }

            // Get students for this class
            const response = await adminClassesService.getClassStudents(classId, {
                per_page: 9999,
            });

            if (response.success) {
                setStudents(response.data || []);
            } else {
                setNotification({ 
                    type: 'error', 
                    message: response.message || 'Failed to load students' 
                });
            }
        } catch (error: any) {
            console.error('Error loading class students:', error);
            setNotification({ 
                type: 'error', 
                message: error.message || 'Failed to load students. Please try again.' 
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppLayout>
            {notification && (
                <NotificationDisplay 
                    notification={notification} 
                    onClose={() => setNotification(null)} 
                />
            )}
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-900">
                <div className="container mx-auto px-4 py-8">
                    <div className="mb-6">
                        <button
                            onClick={() => router.visit('/admin/blockchain-transactions/grades')}
                            className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-4 cursor-pointer"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Grades
                        </button>
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                                Class Students
                            </h1>
                            <p className="text-gray-600 dark:text-white">{className}</p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 dark:border-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-white">
                        <div className="p-6">
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <RefreshCw className={`h-8 w-8 ${TEXT_COLOR_CLASS} animate-spin`} />
                                </div>
                            ) : students.length === 0 ? (
                                <div className="text-center py-12 text-gray-500 dark:text-white">
                                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-white" />
                                    <p>No students found in this class</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {students.map((student) => (
                                        <div
                                            key={student.id}
                                            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 dark:border-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border dark:border-white"
                                        >
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">{student.full_name}</p>
                                                <p className="text-sm text-gray-600 dark:text-white">{student.student_id}</p>
                                            </div>
                                            <button
                                                onClick={() => router.visit(`/admin/blockchain-transactions/grades/${student.id}?class_id=${classId}`)}
                                                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm cursor-pointer"
                                            >
                                                <Eye className="w-4 h-4 mr-1.5" />
                                                View Grades
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};

export default BlockchainClassStudents;

