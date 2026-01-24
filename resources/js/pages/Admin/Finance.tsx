import React, { useState, useEffect, useCallback } from 'react';
import { DollarSign, Plus, Search, Filter, Eye, Trash2, X, RefreshCw, Users, TrendingUp, CreditCard, AlertCircle } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';

// --- THEME COLORS ---
const PRIMARY_COLOR_CLASS = 'bg-[#003366]';
const HOVER_COLOR_CLASS = 'hover:bg-[#002244]';
const TEXT_COLOR_CLASS = 'text-[#003366]';
const RING_COLOR_CLASS = 'focus:ring-[#003366]';
const LIGHT_BG_CLASS = 'bg-[#003366]/10';

// ========================================================================
// 📋 INTERFACES
// ========================================================================

interface Notification {
    type: 'success' | 'error';
    message: string;
}

interface StudentFinance {
    id: number;
    full_name: string;
    student_id: string;
    balance: number;
    miscellaneous_fee: number;
    total_paid: number;
    subjects_enrolled: number;
}

interface ClassFinance {
    id: number;
    class_code: string;
    class_name: string;
    program: string;
    total_students: number;
    total_balance: number;
    average_balance: number;
}

interface FinanceStats {
    total_revenue: number;
    pending_balance: number;
    total_fees: number;
    total_students: number;
}

interface Subject {
    id: number;
    subject_code: string;
    subject_name: string;
    price: number;
}

interface StudentWithFinance {
    id: number;
    full_name: string;
    student_id: string;
    email: string;
    program: string;
    balance: number;
    miscellaneous_fee: number;
    total_paid: number;
}

// ========================================================================
// 🔔 NOTIFICATION COMPONENT
// ========================================================================

const NotificationComponent: React.FC<{ notification: Notification; onClose: () => void }> = ({ notification, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const bgColor = notification.type === 'success' 
        ? PRIMARY_COLOR_CLASS
        : 'bg-gradient-to-r from-red-500 to-red-600';

    return (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-full duration-300">
            <div className={`${bgColor} text-white px-6 py-4 rounded-xl shadow-2xl backdrop-blur-sm`}>
                <div className="flex items-center justify-between">
                    <div className="font-medium">{notification.message}</div>
                </div>
            </div>
        </div>
    );
};

// ========================================================================
// 👁️ VIEW FINANCIAL RECORDS MODAL
// ========================================================================

const ViewFinancialRecordsModal: React.FC<{
    student: StudentWithFinance;
    subjects: Subject[];
    onClose: () => void;
}> = ({ student, subjects, onClose }) => {
    const totalSubjectCost = subjects.reduce((sum, subject) => sum + (subject.price || 0), 0);
    const totalAmount = student.miscellaneous_fee + totalSubjectCost;
    const remainingBalance = totalAmount - student.total_paid;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
                
                <div className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-2xl transition-all">
                    <div className={`${PRIMARY_COLOR_CLASS} px-6 py-4`}>
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">Financial Records</h2>
                            <button onClick={onClose} className="rounded-full p-2 text-white/80 hover:bg-white/20 hover:text-white transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    <div className="p-6 dark:bg-gray-800">
                        {/* Student Info Header */}
                        <div className="flex items-center mb-6 pb-6 border-b dark:border-gray-700">
                            <div className={`${LIGHT_BG_CLASS} dark:bg-gray-700 p-4 rounded-full mr-4`}>
                                <Users className={`h-12 w-12 ${TEXT_COLOR_CLASS} dark:text-white`} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{student.full_name}</h3>
                                <p className="text-gray-500 dark:text-gray-400">{student.student_id} • {student.program}</p>
                            </div>
                        </div>

                        {/* Financial Summary */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className={`${LIGHT_BG_CLASS} dark:bg-gray-700 p-4 rounded-xl`}>
                                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Balance</label>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">₱{student.balance.toFixed(2)}</p>
                            </div>
                            <div className={`${LIGHT_BG_CLASS} dark:bg-gray-700 p-4 rounded-xl`}>
                                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount Paid</label>
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">₱{student.total_paid.toFixed(2)}</p>
                            </div>
                        </div>

                        {/* Fees Breakdown */}
                        <div className="mb-6">
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Fees & Charges</h4>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <span className="text-gray-700 dark:text-gray-300">Miscellaneous Fee</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">₱{student.miscellaneous_fee.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Enrolled Subjects */}
                        <div className="mb-6">
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Enrolled Subjects ({subjects.length})</h4>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {subjects.length > 0 ? (
                                    subjects.map((subject) => (
                                        <div key={subject.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                            <div>
                                                <p className="font-semibold text-gray-900 dark:text-white">{subject.subject_code}</p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">{subject.subject_name}</p>
                                            </div>
                                            <span className="font-semibold text-gray-900 dark:text-white">₱{subject.price ? subject.price.toFixed(2) : '0.00'}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500 dark:text-gray-400">No subjects enrolled</p>
                                )}
                            </div>
                        </div>

                        {/* Total Summary */}
                        <div className="border-t dark:border-gray-700 pt-4 mb-6">
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Subject Cost</p>
                                    <p className="text-lg font-bold text-gray-900 dark:text-white">₱{totalSubjectCost.toFixed(2)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Amount Due</p>
                                    <p className="text-lg font-bold text-gray-900 dark:text-white">₱{totalAmount.toFixed(2)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Remaining Balance</p>
                                    <p className={`text-lg font-bold ${remainingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        ₱{Math.abs(remainingBalance).toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end pt-4 border-t dark:border-gray-700">
                            <button
                                onClick={onClose}
                                className={`px-6 py-3 ${PRIMARY_COLOR_CLASS} text-white rounded-xl ${HOVER_COLOR_CLASS} transition-all font-medium`}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ========================================================================
// 👁️ VIEW STUDENTS MODAL
// ========================================================================

const ViewStudentsModal: React.FC<{
    classItem: ClassFinance;
    students: StudentWithFinance[];
    onClose: () => void;
    onViewRecords: (student: StudentWithFinance) => void;
}> = ({ classItem, students, onClose, onViewRecords }) => {
    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
                
                <div className="relative w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-2xl transition-all">
                    <div className={`${PRIMARY_COLOR_CLASS} px-6 py-4`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-white">Students in {classItem.class_code}</h2>
                                <p className="text-white/80 text-sm mt-1">{classItem.class_name} • {classItem.program}</p>
                            </div>
                            <button onClick={onClose} className="rounded-full p-2 text-white/80 hover:bg-white/20 hover:text-white transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    <div className="p-6 dark:bg-gray-800">
                        {/* Students Table */}
                        <div className="max-h-[60vh] overflow-y-auto">
                            {students.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <Users className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
                                    <p className="text-gray-500 dark:text-gray-400">No students in this class</p>
                                </div>
                            ) : (
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className={`${PRIMARY_COLOR_CLASS} sticky top-0`}>
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase">Student Name</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase">ID</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase">Balance</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase">Amount Paid</th>
                                            <th className="px-6 py-3 text-right text-xs font-bold text-white uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {students.map((student) => (
                                            <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className={`h-10 w-10 rounded-full ${LIGHT_BG_CLASS} dark:bg-gray-700 flex items-center justify-center mr-3`}>
                                                            <span className={`text-sm font-semibold ${TEXT_COLOR_CLASS} dark:text-white`}>
                                                                {student.full_name[0]}{student.full_name.split(' ')[1]?.[0]}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-semibold text-gray-900 dark:text-white">{student.full_name}</div>
                                                            <div className="text-xs text-gray-500 dark:text-gray-400">{student.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-white">{student.student_id}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-700 dark:text-white">₱{student.balance.toFixed(2)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 dark:text-green-400">₱{student.total_paid.toFixed(2)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <button
                                                        onClick={() => onViewRecords(student)}
                                                        className={`p-2 ${TEXT_COLOR_CLASS} ${LIGHT_BG_CLASS} dark:hover:bg-gray-700 rounded-lg transition-colors`}
                                                        title="View Financial Records"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end mt-6 pt-6 border-t dark:border-gray-700">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ========================================================================
// 🏠 MAIN FINANCE PAGE
// ========================================================================

const Finance: React.FC = () => {
    const [classes, setClasses] = useState<ClassFinance[]>([]);
    const [stats, setStats] = useState<FinanceStats>({
        total_revenue: 0,
        pending_balance: 0,
        total_fees: 0,
        total_students: 0,
    });
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState<Notification | null>(null);
    const [search, setSearch] = useState('');
    
    // Modal states
    const [showStudentsModal, setShowStudentsModal] = useState(false);
    const [showRecordsModal, setShowRecordsModal] = useState(false);
    const [selectedClass, setSelectedClass] = useState<ClassFinance | null>(null);
    const [selectedStudent, setSelectedStudent] = useState<StudentWithFinance | null>(null);
    const [classStudents, setClassStudents] = useState<StudentWithFinance[]>([]);
    const [studentSubjects, setStudentSubjects] = useState<Subject[]>([]);

    // Mock data - In real implementation, fetch from API
    useEffect(() => {
        const mockClasses: ClassFinance[] = [
            {
                id: 1,
                class_code: 'BSIT-1A',
                class_name: 'BSIT 1st Year - Section A',
                program: 'BSIT',
                total_students: 35,
                total_balance: 125000,
                average_balance: 3571.43,
            },
            {
                id: 2,
                class_code: 'G12-STEM-A',
                class_name: 'Grade 12 STEM - Section A',
                program: 'Senior High',
                total_students: 42,
                total_balance: 95000,
                average_balance: 2261.90,
            },
            {
                id: 3,
                class_code: 'Grade3-A',
                class_name: 'Grade 3 - Section A',
                program: 'Elementary',
                total_students: 38,
                total_balance: 45000,
                average_balance: 1184.21,
            },
        ];

        const mockStats: FinanceStats = {
            total_revenue: 450000,
            pending_balance: 265000,
            total_fees: 125000,
            total_students: 115,
        };

        setClasses(mockClasses);
        setStats(mockStats);
        setLoading(false);
    }, []);

    const handleViewStudents = (classItem: ClassFinance) => {
        setSelectedClass(classItem);
        
        // Mock student data
        const mockStudents: StudentWithFinance[] = [
            {
                id: 1,
                full_name: 'John Michael Smith',
                student_id: 'STU001',
                email: 'john.smith@student.com',
                program: 'BSIT',
                balance: 15000,
                miscellaneous_fee: 2500,
                total_paid: 10000,
            },
            {
                id: 2,
                full_name: 'Maria Elena Santos',
                student_id: 'STU002',
                email: 'maria.santos@student.com',
                program: 'BSIT',
                balance: 8500,
                miscellaneous_fee: 2500,
                total_paid: 15000,
            },
            {
                id: 3,
                full_name: 'Carlos Alberto Reyes',
                student_id: 'STU003',
                email: 'carlos.reyes@student.com',
                program: 'BSIT',
                balance: 12000,
                miscellaneous_fee: 2500,
                total_paid: 12000,
            },
        ];

        setClassStudents(mockStudents);
        setShowStudentsModal(true);
    };

    const handleViewRecords = (student: StudentWithFinance) => {
        setSelectedStudent(student);
        
        // Mock subject data
        const mockSubjects: Subject[] = [
            {
                id: 1,
                subject_code: 'CS101',
                subject_name: 'Introduction to Programming',
                price: 5000,
            },
            {
                id: 2,
                subject_code: 'MATH101',
                subject_name: 'Calculus I',
                price: 4500,
            },
            {
                id: 3,
                subject_code: 'ENG101',
                subject_name: 'English Communication',
                price: 3000,
            },
            {
                id: 4,
                subject_code: 'SCI101',
                subject_name: 'Physics I',
                price: 5500,
            },
        ];

        setStudentSubjects(mockSubjects);
        setShowRecordsModal(true);
    };

    const filteredClasses = classes.filter(c => 
        c.class_code.toLowerCase().includes(search.toLowerCase()) ||
        c.class_name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <AppLayout>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-900">
                <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
                    {/* Header */}
                    <div className="mb-4 sm:mb-6 md:mb-8">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                            <div className="mb-4 sm:mb-6 md:mb-0">
                                <div className="flex items-center">
                                    <div className={`${PRIMARY_COLOR_CLASS} p-2 sm:p-3 rounded-lg sm:rounded-xl mr-2 sm:mr-3 md:mr-4`}>
                                        <DollarSign className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Finance Management</h1>
                                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-0.5 sm:mt-1">Monitor financial records and balances</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Dashboard */}
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-6 mb-4 sm:mb-6 md:mb-8">
                        {/* Total Revenue */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 md:p-6 border border-gray-100 dark:border-gray-700">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 sm:mb-2">Total Revenue</p>
                                    <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">₱{stats.total_revenue.toLocaleString()}</p>
                                </div>
                                <div className={`${LIGHT_BG_CLASS} dark:bg-gray-700 p-2 sm:p-3 rounded-full mt-2 sm:mt-0`}>
                                    <TrendingUp className={`h-6 w-6 sm:h-7 sm:w-7 ${TEXT_COLOR_CLASS} dark:text-white`} />
                                </div>
                            </div>
                        </div>

                        {/* Pending Balance */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 md:p-6 border border-gray-100 dark:border-gray-700">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 sm:mb-2">Pending Balance</p>
                                    <p className="text-2xl sm:text-3xl font-bold text-orange-600 dark:text-orange-400">₱{stats.pending_balance.toLocaleString()}</p>
                                </div>
                                <div className={`${LIGHT_BG_CLASS} dark:bg-gray-700 p-2 sm:p-3 rounded-full mt-2 sm:mt-0`}>
                                    <AlertCircle className={`h-6 w-6 sm:h-7 sm:w-7 ${TEXT_COLOR_CLASS} dark:text-white`} />
                                </div>
                            </div>
                        </div>

                        {/* Total Fees */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 md:p-6 border border-gray-100 dark:border-gray-700">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 sm:mb-2">Total Fees</p>
                                    <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">₱{stats.total_fees.toLocaleString()}</p>
                                </div>
                                <div className={`${LIGHT_BG_CLASS} dark:bg-gray-700 p-2 sm:p-3 rounded-full mt-2 sm:mt-0`}>
                                    <CreditCard className={`h-6 w-6 sm:h-7 sm:w-7 ${TEXT_COLOR_CLASS} dark:text-white`} />
                                </div>
                            </div>
                        </div>

                        {/* Total Students */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 md:p-6 border border-gray-100 dark:border-gray-700">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 sm:mb-2">Total Students</p>
                                    <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{stats.total_students}</p>
                                </div>
                                <div className={`${LIGHT_BG_CLASS} dark:bg-gray-700 p-2 sm:p-3 rounded-full mt-2 sm:mt-0`}>
                                    <Users className={`h-6 w-6 sm:h-7 sm:w-7 ${TEXT_COLOR_CLASS} dark:text-white`} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 border border-gray-100 dark:border-gray-700">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by class code or name..."
                                className={`pl-10 w-full px-4 py-2 sm:py-3 border border-gray-200 dark:border-gray-600 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                            />
                        </div>
                    </div>

                    {/* Classes Table */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-700">
                                    <tr>
                                        <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">Class</th>
                                        <th className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">Program</th>
                                        <th className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">Students</th>
                                        <th className="hidden lg:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">Total Balance</th>
                                        <th className="hidden lg:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">Avg Balance</th>
                                        <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} className="px-3 sm:px-6 py-8 sm:py-12 text-center">
                                                <div className="flex justify-center">
                                                    <RefreshCw className={`h-6 w-6 sm:h-8 sm:w-8 ${TEXT_COLOR_CLASS} animate-spin`} />
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredClasses.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-3 sm:px-6 py-8 sm:py-12 text-center text-gray-500 dark:text-gray-400">
                                                <div className="flex flex-col items-center">
                                                    <DollarSign className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 dark:text-gray-600 mb-3 sm:mb-4" />
                                                    <p className="text-base sm:text-lg font-medium dark:text-gray-200">No classes found</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredClasses.map((classItem) => (
                                            <tr key={classItem.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                                <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                                                    <div>
                                                        <div className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">{classItem.class_code}</div>
                                                        <div className="text-xs text-gray-600 dark:text-gray-400">{classItem.class_name}</div>
                                                    </div>
                                                </td>
                                                <td className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700 dark:text-white">{classItem.program}</td>
                                                <td className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700 dark:text-white">{classItem.total_students}</td>
                                                <td className="hidden lg:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-orange-600 dark:text-orange-400">₱{classItem.total_balance.toLocaleString()}</td>
                                                <td className="hidden lg:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700 dark:text-white">₱{classItem.average_balance.toFixed(2)}</td>
                                                <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap text-right">
                                                    <button
                                                        onClick={() => handleViewStudents(classItem)}
                                                        className={`p-1.5 sm:p-2 ${TEXT_COLOR_CLASS} ${LIGHT_BG_CLASS} dark:hover:bg-gray-700 rounded-lg transition-colors`}
                                                        title="View Students"
                                                    >
                                                        <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Modals */}
                    {showStudentsModal && selectedClass && (
                        <ViewStudentsModal
                            classItem={selectedClass}
                            students={classStudents}
                            onClose={() => setShowStudentsModal(false)}
                            onViewRecords={handleViewRecords}
                        />
                    )}

                    {showRecordsModal && selectedStudent && (
                        <ViewFinancialRecordsModal
                            student={selectedStudent}
                            subjects={studentSubjects}
                            onClose={() => setShowRecordsModal(false)}
                        />
                    )}

                    {notification && (
                        <NotificationComponent
                            notification={notification}
                            onClose={() => setNotification(null)}
                        />
                    )}
                </div>
            </div>
        </AppLayout>
    );
};

export default Finance;

