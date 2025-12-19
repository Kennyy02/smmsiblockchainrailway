import React, { useState, useEffect } from 'react';
import { RefreshCw, ArrowLeft, X, CalendarCheck } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Link, usePage, router } from '@inertiajs/react';
import { adminAttendanceService, Attendance } from '../../../services/AdminAttendanceService';
import { adminClassSubjectService } from '../../../services/AdminClassSubjectService';

const PRIMARY_COLOR_CLASS = 'bg-gradient-to-r from-purple-600 to-indigo-600';
const TEXT_COLOR_CLASS = 'text-purple-600';

// Helper function to format year level for college
const formatYearLevel = (yearLevel: number | null): string => {
    if (yearLevel === null || yearLevel === undefined) return '';
    const yearNames = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'];
    if (yearLevel >= 1 && yearLevel <= yearNames.length) {
        return yearNames[yearLevel - 1];
    }
    return `${yearLevel}${yearLevel === 1 ? 'st' : yearLevel === 2 ? 'nd' : yearLevel === 3 ? 'rd' : 'th'} Year`;
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
                    <button onClick={onClose} className="ml-4 rounded-full p-1 hover:bg-white/20 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

interface StudentAttendance {
    subject: {
        id: number;
        subject_code: string;
        subject_name: string;
    };
    attendance_records: Array<{
        id: number;
        attendance_date: string;
        status: 'Present' | 'Absent' | 'Late' | 'Excused';
    }>;
}

interface GroupedAttendance {
    academic_year_id: number;
    semester_id: number;
    academic_year_name: string;
    semester_name: string;
    attendance: StudentAttendance[];
}

const BlockchainStudentAttendance: React.FC = () => {
    const { props } = usePage();
    const studentId = (props as any).studentId;
    const classId = (props as any).classId;
    
    const [loading, setLoading] = useState(true);
    const [groupedAttendance, setGroupedAttendance] = useState<GroupedAttendance[]>([]);
    const [studentName, setStudentName] = useState('');
    const [className, setClassName] = useState('');
    const [yearLevel, setYearLevel] = useState<number | null>(null);
    const [notification, setNotification] = useState<Notification | null>(null);

    useEffect(() => {
        if (studentId && classId) {
            loadStudentAttendance();
        }
    }, [studentId, classId]);

    const loadStudentAttendance = async () => {
        setLoading(true);
        try {
            // Get class information
            const classRes = await fetch(`/api/classes/${classId}`, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
            });
            
            if (!classRes.ok) {
                const errorData = await classRes.json().catch(() => ({ message: 'Failed to load class information' }));
                throw new Error(errorData.message || errorData.error || `Server error: ${classRes.status}`);
            }
            
            const classData = await classRes.json();
            
            if (!classData.success) {
                throw new Error(classData.message || 'Failed to load class information');
            }
            
            if (classData.success) {
                setClassName(classData.data.class_code || classData.data.class_name);
                
                // Extract year level
                if (classData.data.year_level !== undefined && classData.data.year_level !== null) {
                    setYearLevel(classData.data.year_level);
                }
                
                // Get student information
                const studentRes = await fetch(`/api/students/${studentId}`, {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                });
                
                if (studentRes.ok) {
                    const studentData = await studentRes.json();
                    if (studentData.success) {
                        setStudentName(studentData.data.full_name || `${studentData.data.first_name} ${studentData.data.last_name}`);
                    }
                } else {
                    console.warn('Failed to load student information:', studentRes.status);
                }

                // Get all subjects for this class FIRST
                const classSubjectsRes = await adminClassSubjectService.getClassSubjects({
                    class_id: classId,
                    per_page: 9999,
                });

                // Get all attendance for this student (not filtered by academic year/semester)
                const classSubjectIds = classSubjectsRes.success && classSubjectsRes.data 
                    ? classSubjectsRes.data.map((cs: any) => cs.id)
                    : [];
                
                const response = await adminAttendanceService.getAttendance({
                    student_id: studentId,
                    per_page: 9999,
                });

                if (!classSubjectsRes.success) {
                    setNotification({ 
                        type: 'error', 
                        message: classSubjectsRes.message || 'Failed to load class subjects' 
                    });
                    setGroupedAttendance([]);
                    return;
                }

                const classSubjects = classSubjectsRes.data || [];
                
                if (classSubjects.length === 0) {
                    setNotification({ 
                        type: 'info', 
                        message: 'No subjects found for this class. Please link subjects to this class first.' 
                    });
                    setGroupedAttendance([]);
                    return;
                }

                // Group attendance by academic_year_id and semester_id
                const attendanceByPeriod = new Map<string, { academic_year_id: number; semester_id: number; academic_year_name: string; semester_name: string; attendance: Map<number, Attendance[]> }>();
                
                if (response.success && response.data && response.data.length > 0) {
                    response.data.forEach((attendance: Attendance) => {
                        // Only process attendance that belongs to this class
                        const attendanceClassSubjectId = attendance.class_subject_id;
                        if (classSubjectIds.length > 0 && !classSubjectIds.includes(attendanceClassSubjectId)) {
                            return;
                        }
                        
                        // Get academic year and semester from class_subject
                        const classSubject = (attendance as any).class_subject;
                        const academicYearId = classSubject?.academic_year_id || (classSubject?.academicYear?.id) || null;
                        const semesterId = classSubject?.semester_id || (classSubject?.semester?.id) || null;
                        
                        if (!academicYearId || !semesterId) {
                            return;
                        }
                        
                        const key = `${academicYearId}_${semesterId}`;
                        
                        // Get academic year and semester names
                        const academicYearName = classSubject?.academic_year?.year_name || 
                                               classSubject?.academicYear?.year_name || 
                                               '';
                        const semesterName = classSubject?.semester?.semester_name || 
                                           classSubject?.semester?.semester_name || 
                                           '';
                        
                        if (!attendanceByPeriod.has(key)) {
                            attendanceByPeriod.set(key, {
                                academic_year_id: academicYearId,
                                semester_id: semesterId,
                                academic_year_name: academicYearName,
                                semester_name: semesterName,
                                attendance: new Map()
                            });
                        }
                        
                        const periodData = attendanceByPeriod.get(key)!;
                        const subjectId = classSubject?.subject?.id || null;
                        if (subjectId) {
                            if (!periodData.attendance.has(subjectId)) {
                                periodData.attendance.set(subjectId, []);
                            }
                            periodData.attendance.get(subjectId)!.push(attendance);
                        }
                    });
                }

                // Create grouped attendance structure
                const grouped: GroupedAttendance[] = Array.from(attendanceByPeriod.values()).map(periodData => {
                    // Create the attendance structure for this period
                    const attendanceTable: StudentAttendance[] = classSubjects.map((cs: any) => {
                        const subjectId = cs.subject?.id || cs.subject_id;
                        const records = periodData.attendance.get(subjectId) || [];
                        
                        // Sort records by date (descending)
                        records.sort((a, b) => new Date(b.attendance_date).getTime() - new Date(a.attendance_date).getTime());
                        
                        return {
                            subject: cs.subject || {
                                id: cs.subject_id,
                                subject_code: cs.subject_code || '',
                                subject_name: cs.subject_name || '',
                            },
                            attendance_records: records.map(record => ({
                                id: record.id,
                                attendance_date: record.attendance_date,
                                status: record.status,
                            }))
                        };
                    });

                    return {
                        academic_year_id: periodData.academic_year_id,
                        semester_id: periodData.semester_id,
                        academic_year_name: periodData.academic_year_name,
                        semester_name: periodData.semester_name,
                        attendance: attendanceTable
                    };
                });

                // Sort by academic year (desc) and semester (desc)
                grouped.sort((a, b) => {
                    if (a.academic_year_id !== b.academic_year_id) {
                        return b.academic_year_id - a.academic_year_id;
                    }
                    return b.semester_id - a.semester_id;
                });

                setGroupedAttendance(grouped);
            }
        } catch (error: any) {
            console.error('Error loading student attendance:', error);
            setNotification({ 
                type: 'error', 
                message: error.message || 'Failed to load attendance. Please try again or contact support if the issue persists.' 
            });
            setGroupedAttendance([]);
        } finally {
            setLoading(false);
        }
    };

    const renderStatusTag = (status: 'Present' | 'Absent' | 'Late' | 'Excused') => {
        const colors = {
            Present: 'bg-green-100 text-green-800',
            Absent: 'bg-red-100 text-red-800',
            Late: 'bg-yellow-100 text-yellow-800',
            Excused: 'bg-blue-100 text-blue-800',
        };
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status]}`}>
                {status}
            </span>
        );
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

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
                        <button
                            onClick={() => {
                                if (classId) {
                                    router.visit(`/admin/blockchain-transactions/attendance/class/${classId}/students`);
                                } else {
                                    router.visit('/admin/blockchain-transactions/attendance');
                                }
                            }}
                            className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-4"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Students
                        </button>
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
                                Student Attendance
                            </h1>
                            <div className="mb-4">
                                <h2 className="text-3xl font-bold text-gray-900 mb-3">{studentName}</h2>
                                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                    <div>
                                        <span className="font-semibold">Class:</span> {className}
                                    </div>
                                    {yearLevel !== null && (
                                        <div>
                                            <span className="font-semibold">Year Level:</span> {formatYearLevel(yearLevel)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 p-6">
                            <div className="flex items-center justify-center py-12">
                                <RefreshCw className={`h-8 w-8 ${TEXT_COLOR_CLASS} animate-spin`} />
                            </div>
                        </div>
                    ) : groupedAttendance.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 p-6">
                            <div className="text-center py-12 text-gray-500">
                                No attendance records found for this student
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {groupedAttendance.map((group, groupIndex) => (
                                <div key={`${group.academic_year_id}_${group.semester_id}`} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                                        <div className="flex flex-wrap gap-4 text-sm">
                                            <div>
                                                <span className="font-semibold text-gray-700">Academic Year:</span> 
                                                <span className="ml-2 text-gray-900">{group.academic_year_name || 'N/A'}</span>
                                            </div>
                                            <div>
                                                <span className="font-semibold text-gray-700">Semester:</span> 
                                                <span className="ml-2 text-gray-900">{group.semester_name || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <div className="space-y-4">
                                            {group.attendance.map((subjectAttendance, index) => (
                                                <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                                                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                                                        <div className="font-semibold text-gray-900">{subjectAttendance.subject.subject_code}</div>
                                                        <div className="text-sm text-gray-600">{subjectAttendance.subject.subject_name}</div>
                                                    </div>
                                                    <div className="p-4">
                                                        {subjectAttendance.attendance_records.length === 0 ? (
                                                            <p className="text-sm text-gray-500 text-center py-4">No attendance records</p>
                                                        ) : (
                                                            <div className="overflow-x-auto">
                                                                <table className="min-w-full border-collapse border border-gray-300">
                                                                    <thead>
                                                                        <tr className="bg-gray-100">
                                                                            <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700">Date</th>
                                                                            <th className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-700">Status</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {subjectAttendance.attendance_records.map((record) => (
                                                                            <tr key={record.id} className="hover:bg-gray-50">
                                                                                <td className="border border-gray-300 px-4 py-2 text-sm">
                                                                                    {formatDate(record.attendance_date)}
                                                                                </td>
                                                                                <td className="border border-gray-300 px-4 py-2 text-center text-sm">
                                                                                    {renderStatusTag(record.status)}
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
};

export default BlockchainStudentAttendance;

