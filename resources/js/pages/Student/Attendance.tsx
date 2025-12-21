import React, { useState, useEffect, useMemo } from 'react';
import { 
    CalendarCheck, 
    RefreshCw, 
    X, 
    ChevronLeft, 
    ChevronRight,
    AlertCircle,
    TrendingUp,
    CheckCircle,
    XCircle
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { useStudentAuth } from '../../../services/usestudentauth';
import { 
    adminAttendanceService, 
    Attendance, 
    AttendanceStats, 
    MinimalClassSubject,
} from '../../../services/AdminAttendanceService';
import { adminClassSubjectService } from '../../../services/AdminClassSubjectService';

const PRIMARY_COLOR_CLASS = 'bg-gradient-to-r from-purple-600 to-indigo-600';
const TEXT_COLOR_CLASS = 'text-purple-600';

// Helper function to format grade/year level based on education category
const formatGradeYearLevel = (yearLevel: number | null): { label: string; value: string } => {
    if (yearLevel === null || yearLevel === undefined) return { label: '', value: '' };
    
    // College: 13-16 (1st Year - 4th Year)
    if (yearLevel >= 13 && yearLevel <= 16) {
        const yearNames = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
        return { label: 'Year Level', value: yearNames[yearLevel - 13] };
    }
    
    // Elementary (1-6), Junior High (7-10), Senior High (11-12): All use "Grade Level"
    return { label: 'Grade Level', value: `Grade ${yearLevel}` };
};

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

// Helper function to get status code
const getStatusCode = (status: string): string => {
    switch (status) {
        case 'Present': return 'P';
        case 'Absent': return 'A';
        case 'Late': return 'L';
        case 'Excused': return 'E';
        default: return '';
    }
};

// Helper function to get status color
const getStatusColor = (status: string): string => {
    switch (status) {
        case 'Present': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-white dark:border-white border dark:border-white';
        case 'Absent': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-white dark:border-white border dark:border-white';
        case 'Late': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-white dark:border-white border dark:border-white';
        case 'Excused': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-white dark:border-white border dark:border-white';
        default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-white dark:border-white border dark:border-white';
    }
};

// Helper function to get days in month
const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month + 1, 0).getDate();
};

// Helper function to get day abbreviation
const getDayAbbr = (dayIndex: number): string => {
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    return days[dayIndex];
};

// StatCard Component
const StatCard: React.FC<{ title: string; value: string | number; icon: React.ElementType; color: string }> = ({ title, value, icon: Icon, color }) => {
    const displayValue = (typeof value === 'number' && isNaN(value)) ? 'N/A' : value;
    const bgColor = color.replace('text-', 'bg-').replace('-600', '-100');
    
    return (
        <div className="bg-white dark:bg-gray-800 dark:border-white rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-white">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">{title}</p>
                    <p className={`text-3xl font-bold ${color}`}>{displayValue}</p>
                </div>
                <div className={`${bgColor} p-3 rounded-xl`}>
                    <Icon className={`h-8 w-8 ${color}`} />
                </div>
            </div>
        </div>
    );
};

const MyAttendance: React.FC = () => {
    const { currentStudentId, isStudent, user } = useStudentAuth();
    
    const [loading, setLoading] = useState(true);
    const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
    const [classSubjects, setClassSubjects] = useState<any[]>([]);
    const [studentName, setStudentName] = useState('');
    const [className, setClassName] = useState('');
    const [yearLevel, setYearLevel] = useState<number | null>(null);
    const [notification, setNotification] = useState<Notification | null>(null);
    
    // Month/Year pagination
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

    useEffect(() => {
        if (currentStudentId) {
            loadStudentAttendance();
        }
    }, [currentStudentId, currentMonth, currentYear]);

    const loadStudentAttendance = async () => {
        if (!currentStudentId) {
            setLoading(false);
            return;
        }
        
        setLoading(true);
        try {
            // Get student information
            const studentRes = await fetch(`/api/students/${currentStudentId}`, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
            });
            
            if (studentRes.ok) {
                const studentData = await studentRes.json();
                if (studentData.success) {
                    setStudentName(studentData.data.full_name || `${studentData.data.first_name} ${studentData.data.last_name}`);
                    if (studentData.data.year_level !== undefined && studentData.data.year_level !== null) {
                        setYearLevel(studentData.data.year_level);
                    }
                }
            }

            // Get all class subjects for this student
            const classSubjectsRes = await adminClassSubjectService.getClassSubjects({
                student_id: currentStudentId,
                per_page: 9999,
            });

            if (!classSubjectsRes.success) {
                setNotification({ 
                    type: 'error', 
                    message: classSubjectsRes.message || 'Failed to load class subjects' 
                });
                setClassSubjects([]);
                return;
            }

            const subjects = classSubjectsRes.data || [];
            setClassSubjects(subjects);
            
            if (subjects.length === 0) {
                setNotification({ 
                    type: 'info', 
                    message: 'No subjects found. Please ensure you are enrolled in classes.' 
                });
                setAttendanceRecords([]);
                return;
            }

            // Get the class information from the first class subject
            if (subjects.length > 0 && subjects[0].class) {
                setClassName(subjects[0].class.class_code || subjects[0].class.class_name || '');
                if (subjects[0].class.year_level !== undefined && subjects[0].class.year_level !== null) {
                    setYearLevel(subjects[0].class.year_level);
                }
            }

            // Calculate date range for the current month
            const daysInMonth = getDaysInMonth(currentYear, currentMonth);
            const startDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
            const endDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

            // Get attendance for this student in the selected month
            const response = await adminAttendanceService.getAttendance({
                student_id: currentStudentId,
                start_date: startDate,
                end_date: endDate,
                per_page: 9999,
            });

            if (response.success) {
                // Filter attendance to only include records for this student's class subjects
                const classSubjectIds = subjects.map((cs: any) => cs.id);
                const filteredAttendance = (response.data || []).filter((att: Attendance) => 
                    classSubjectIds.includes(att.class_subject_id)
                );
                setAttendanceRecords(filteredAttendance);
            } else {
                setNotification({ 
                    type: 'error', 
                    message: response.message || 'Failed to load attendance records' 
                });
                setAttendanceRecords([]);
            }
        } catch (error: any) {
            console.error('Error loading student attendance:', error);
            setNotification({ 
                type: 'error', 
                message: error.message || 'Failed to load attendance. Please try again or contact support if the issue persists.' 
            });
            setAttendanceRecords([]);
        } finally {
            setLoading(false);
        }
    };

    // Calculate attendance statistics
    const attendanceStats = useMemo(() => {
        const totalRecords = attendanceRecords.length;
        const presentCount = attendanceRecords.filter(att => att.status === 'Present').length;
        const absentCount = attendanceRecords.filter(att => att.status === 'Absent').length;
        const attendanceRate = totalRecords > 0 ? ((presentCount / totalRecords) * 100) : 0;
        
        return {
            totalRecords,
            presentCount,
            absentCount,
            attendanceRate: Math.round(attendanceRate * 10) / 10, // Round to 1 decimal place
        };
    }, [attendanceRecords]);

    // Create a map of attendance by subject and date
    const attendanceMap = useMemo(() => {
        const map = new Map<string, Attendance>();
        attendanceRecords.forEach(att => {
            const subjectId = (att.class_subject as any)?.subject?.id || 
                             (att.class_subject as any)?.subject_id || 
                             null;
            if (subjectId) {
                const date = new Date(att.attendance_date).getDate();
                const key = `${subjectId}_${date}`;
                map.set(key, att);
            }
        });
        return map;
    }, [attendanceRecords]);

    // Get calendar days - start directly on the first day of the month, no padding
    const calendarDays = useMemo(() => {
        const daysInMonth = getDaysInMonth(currentYear, currentMonth);
        const days: number[] = [];
        
        // Add days of the month directly, starting from day 1
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(day);
        }
        
        return days;
    }, [currentYear, currentMonth]);

    // Navigation functions
    const goToPreviousMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
    };

    const goToNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
    };

    const goToCurrentMonth = () => {
        const now = new Date();
        setCurrentMonth(now.getMonth());
        setCurrentYear(now.getFullYear());
    };

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    if (!isStudent) {
        return (
            <AppLayout>
                <div className="p-8">
                    <div className="bg-red-50 dark:bg-red-900 dark:border-white border border-red-400 dark:border-white text-red-700 dark:text-white px-6 py-4 rounded-xl">
                        <div className="flex items-center">
                            <AlertCircle className="h-6 w-6 mr-3" />
                            <div>
                                <p className="font-bold">Access Denied</p>
                                <p className="text-sm">This page is only accessible to students.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            {notification && (
                <NotificationDisplay 
                    notification={notification} 
                    onClose={() => setNotification(null)} 
                />
            )}
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="container mx-auto px-4 py-8">
                    <div className="mb-6">
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
                                My Attendance
                            </h1>
                            <div className="mb-4">
                                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">{studentName || user?.name || 'Student'}</h2>
                                <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-300">
                                    {className && (
                                        <div>
                                            <span className="font-semibold">Class:</span> {className}
                                        </div>
                                    )}
                                    {yearLevel !== null && (() => {
                                        const { label, value } = formatGradeYearLevel(yearLevel);
                                        return (
                                            <div>
                                                <span className="font-semibold">{label}:</span> {value}
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Analytics Cards */}
                    {!loading && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <StatCard 
                                title="Attendance Rate" 
                                value={`${attendanceStats.attendanceRate}%`} 
                                icon={TrendingUp} 
                                color="text-purple-600" 
                            />
                            <StatCard 
                                title="Present" 
                                value={attendanceStats.presentCount} 
                                icon={CheckCircle} 
                                color="text-green-600" 
                            />
                            <StatCard 
                                title="Absent" 
                                value={attendanceStats.absentCount} 
                                icon={XCircle} 
                                color="text-red-600" 
                            />
                        </div>
                    )}

                    {loading ? (
                        <div className="bg-white dark:bg-gray-800 dark:border-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-white p-6">
                            <div className="flex items-center justify-center py-12">
                                <RefreshCw className={`h-8 w-8 ${TEXT_COLOR_CLASS} dark:text-white animate-spin`} />
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-gray-800 dark:border-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-white">
                            {/* Month/Year Navigation */}
                            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-gray-900 dark:to-gray-900 dark:border-white px-6 py-4 border-b border-gray-200 dark:border-white">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={goToPreviousMonth}
                                            className="p-2 hover:bg-white dark:hover:bg-gray-700 dark:border-white rounded-lg transition-colors cursor-pointer border dark:border-white"
                                        >
                                            <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-white" />
                                        </button>
                                        <div className="text-lg font-semibold text-gray-900 dark:text-white">
                                            {monthNames[currentMonth]} / {currentYear}
                                        </div>
                                        <button
                                            onClick={goToNextMonth}
                                            className="p-2 hover:bg-white dark:hover:bg-gray-700 dark:border-white rounded-lg transition-colors cursor-pointer border dark:border-white"
                                        >
                                            <ChevronRight className="w-5 h-5 text-gray-700 dark:text-white" />
                                        </button>
                                    </div>
                                    <button
                                        onClick={goToCurrentMonth}
                                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm cursor-pointer"
                                    >
                                        Today
                                    </button>
                                </div>
                            </div>

                            {/* Attendance Grid */}
                            <div className="p-6 overflow-x-auto">
                                {classSubjects.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500 dark:text-gray-300">
                                        No subjects found for this class
                                    </div>
                                ) : (
                                    <div className="min-w-full">
                                        <table className="w-full border-collapse border border-gray-300 dark:border-white text-sm">
                                            <thead>
                                                <tr className="bg-gray-100 dark:bg-gray-900 dark:border-white">
                                                    <th className="border border-gray-300 dark:border-white px-4 py-2 text-left font-semibold text-gray-700 dark:text-white sticky left-0 bg-gray-100 dark:bg-gray-900 z-10">
                                                        Name
                                                    </th>
                                                    {/* Date headers - aligned with calendar */}
                                                    {calendarDays.map((day, index) => (
                                                        <th
                                                            key={index}
                                                            className="border border-gray-300 dark:border-white px-2 py-2 text-center font-semibold text-gray-700 dark:text-white min-w-[40px]"
                                                        >
                                                            {day}
                                                        </th>
                                                    ))}
                                                </tr>
                                                <tr className="bg-gray-50 dark:bg-gray-800 dark:border-white">
                                                    <th className="border border-gray-300 dark:border-white px-4 py-1 text-left text-xs text-gray-600 dark:text-gray-300 sticky left-0 bg-gray-50 dark:bg-gray-800 z-10">
                                                        Subject
                                                    </th>
                                                    {/* Day of week headers - aligned with calendar */}
                                                    {calendarDays.map((day, index) => (
                                                        <th
                                                            key={index}
                                                                className="border border-gray-300 dark:border-white px-2 py-1 text-center text-xs text-gray-600 dark:text-gray-300 min-w-[40px]"
                                                        >
                                                            {getDayAbbr(new Date(currentYear, currentMonth, day).getDay())}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {classSubjects.map((subject) => {
                                                    const subjectId = subject.subject?.id || subject.subject_id;
                                                    const subjectCode = subject.subject?.subject_code || subject.subject_code || '';
                                                    const subjectName = subject.subject?.subject_name || subject.subject_name || '';
                                                    
                                                    return (
                                                        <tr key={subjectId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                            <td className="border border-gray-300 dark:border-white px-4 py-3 sticky left-0 bg-white dark:bg-gray-800 dark:border-white z-10">
                                                                <div className="font-semibold text-gray-900 dark:text-white">{subjectCode}</div>
                                                                <div className="text-xs text-gray-600 dark:text-gray-300">{subjectName}</div>
                                                            </td>
                                                            {/* Attendance cells - aligned with calendar */}
                                                            {calendarDays.map((day, index) => {
                                                                const key = `${subjectId}_${day}`;
                                                                const attendance = attendanceMap.get(key);
                                                                
                                                                return (
                                                                    <td
                                                                        key={index}
                                                                        className="border border-gray-300 dark:border-white px-2 py-2 text-center min-w-[40px]"
                                                                    >
                                                                        {attendance ? (
                                                                            <span
                                                                                className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${getStatusColor(attendance.status)}`}
                                                                                title={attendance.status}
                                                                            >
                                                                                {getStatusCode(attendance.status)}
                                                                            </span>
                                                                        ) : null}
                                                                    </td>
                                                                );
                                                            })}
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* Legend */}
                            <div className="bg-gray-50 dark:bg-gray-900 dark:border-white px-6 py-4 border-t border-gray-200 dark:border-white">
                                <div className="flex flex-wrap items-center gap-4 text-sm">
                                    <span className="font-semibold text-gray-700 dark:text-white">Legend:</span>
                                    <span className="flex items-center gap-2">
                                        <span className="inline-block px-2 py-1 rounded bg-green-100 text-green-800 dark:bg-green-900 dark:text-white dark:border-white text-xs font-medium border dark:border-white">P</span>
                                        <span className="text-gray-600 dark:text-gray-300">Present</span>
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <span className="inline-block px-2 py-1 rounded bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800 text-xs font-medium border dark:border-red-800">A</span>
                                        <span className="text-gray-600 dark:text-gray-300">Absent</span>
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <span className="inline-block px-2 py-1 rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800 text-xs font-medium border dark:border-yellow-800">L</span>
                                        <span className="text-gray-600 dark:text-gray-300">Late</span>
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <span className="inline-block px-2 py-1 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800 text-xs font-medium border dark:border-blue-800">E</span>
                                        <span className="text-gray-600 dark:text-gray-300">Excused</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
};

export default MyAttendance;
