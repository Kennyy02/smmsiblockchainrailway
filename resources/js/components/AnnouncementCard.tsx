import React, { useState, useEffect } from 'react';
import { Bell, Calendar, Users, RefreshCw } from 'lucide-react';
import { adminAnnouncementService, Announcement } from '../../services/AdminAnnouncementService';

interface AnnouncementCardProps {
    userRole?: 'admin' | 'teacher' | 'parent' | 'student';
}

const AnnouncementCard: React.FC<AnnouncementCardProps> = ({ userRole = 'student' }) => {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAnnouncements = async () => {
        try {
            setLoading(true);
            const response = await adminAnnouncementService.getAnnouncements({
                per_page: 5,
                status: 'Published'
            });
            
            if (response.success && response.data) {
                const now = new Date();
                // Filter out expired announcements
                const activeAnnouncements = response.data.filter(announcement => {
                    return !announcement.expires_at || new Date(announcement.expires_at) > now;
                });
                setAnnouncements(activeAnnouncements);
            }
        } catch (error) {
            console.error('Error fetching announcements:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
    };

    const getAudienceBadgeColor = (audience: string) => {
        switch (audience) {
            case 'All':
                return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-white dark:border-white border dark:border-white';
            case 'Teachers':
                return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-white dark:border-white border dark:border-white';
            case 'Students':
                return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-white dark:border-white border dark:border-white';
            case 'Parents':
                return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-white dark:border-white border dark:border-white';
            default:
                return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-white dark:border-white border dark:border-white';
        }
    };

    if (loading) {
        return (
            <div className="bg-white dark:bg-transparent rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-white">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                        <Bell className="w-5 h-5 mr-2 text-[#003366] dark:text-white" />
                        Announcements
                    </h3>
                </div>
                <div className="flex justify-center items-center py-8">
                    <RefreshCw className="w-6 h-6 text-gray-400 dark:text-white animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-transparent rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-white">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                    <Bell className="w-5 h-5 mr-2 text-[#003366] dark:text-white" />
                    Announcements
                </h3>
                <button
                    onClick={fetchAnnouncements}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Refresh announcements"
                >
                    <RefreshCw className="w-4 h-4 text-gray-600 dark:text-white" />
                </button>
            </div>

            {announcements.length === 0 ? (
                <div className="text-center py-8">
                    <Bell className="w-12 h-12 text-gray-300 dark:text-white mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-white">No announcements at this time</p>
                </div>
            ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                    {announcements.map((announcement) => (
                        <div
                            key={announcement.id}
                            className="border border-gray-200 dark:border-white rounded-lg p-4 hover:border-[#003366] dark:hover:border-white transition-colors"
                        >
                            <div className="flex items-start justify-between mb-2">
                                <h4 className="font-semibold text-gray-900 dark:text-white flex-1">
                                    {announcement.title}
                                </h4>
                                <span className={`text-xs px-2 py-1 rounded-full ${getAudienceBadgeColor(announcement.target_audience)}`}>
                                    {announcement.target_audience}
                                </span>
                            </div>
                            
                            <p className="text-sm text-gray-600 dark:text-white mb-3 line-clamp-3">
                                {announcement.content}
                            </p>
                            
                            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-white">
                                <div className="flex items-center">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    {formatDate(announcement.published_at || announcement.created_at)}
                                </div>
                                {announcement.creator && (
                                    <div className="flex items-center">
                                        <Users className="w-3 h-3 mr-1" />
                                        Posted by {announcement.creator.user?.name || 'Admin'}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AnnouncementCard;

