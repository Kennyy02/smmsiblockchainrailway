import React, { useState, useEffect } from 'react';
import { 
    RefreshCw, Search, Filter, Eye, Trash2, Zap, CheckCircle, 
    XCircle, Hash, Award, Shield, Clock, X, Download, Plus
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';

import { 
    adminBlockchainService,
    BlockchainTransaction,
    Certificate,
    CertificateVerification,
    BlockchainStats,
    TransactionStatus,
    TransactionType,
    CertificateType,
    PaginationData,
    CertificateFormData,
} from '../../../services/AdminBlockchainService';
import { adminStudentService, Student } from '../../../services/AdminStudentService';
import { adminTeacherService, Teacher } from '../../../services/AdminTeacherService';
import CertificateTemplate from '@/components/CertificateTemplate';

// ========================================================================
// 🎨 THEME CONFIGURATION
// ========================================================================
const PRIMARY_COLOR_CLASS = 'bg-gradient-to-r from-purple-600 to-indigo-600';
const HOVER_COLOR_CLASS = 'hover:from-purple-700 hover:to-indigo-700';
const TEXT_COLOR_CLASS = 'text-purple-600';
const RING_COLOR_CLASS = 'focus:ring-purple-500';

// ========================================================================
// 📦 INTERFACES
// ========================================================================
interface Notification {
    type: 'success' | 'error' | 'info';
    message: string;
}

type TabType = 'transactions' | 'certificates' | 'verify';

// ========================================================================
// 🔔 NOTIFICATION COMPONENT
// ========================================================================
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

// ========================================================================
// 📊 STATS CARDS COMPONENT
// ========================================================================
const StatsCards: React.FC<{ stats: BlockchainStats }> = ({ stats }) => {
    const cards = [
        { title: 'Total Transactions', value: stats.total_transactions, icon: Hash, color: 'bg-blue-500' },
        { title: 'Confirmed', value: stats.confirmed_count, icon: CheckCircle, color: 'bg-green-500' },
        { title: 'Pending', value: stats.pending_count, icon: Clock, color: 'bg-yellow-500' },
        { title: 'Failed', value: stats.failed_count, icon: XCircle, color: 'bg-red-500' },
        { title: 'Success Rate', value: `${stats.success_rate}%`, icon: Shield, color: 'bg-purple-500' },
        { title: 'Total Certificates', value: stats.total_certificates, icon: Award, color: 'bg-indigo-500' },
    ];

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4 lg:gap-6 mb-4 sm:mb-6">
            {cards.map((card, idx) => (
                <div key={idx} className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-md sm:shadow-lg p-3 sm:p-4 md:p-5 lg:p-6 border border-gray-100 dark:border-white transform hover:scale-105 transition-all">
                    {/* Mobile: Centered layout */}
                    <div className="flex flex-col items-center text-center md:hidden">
                        <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-white mb-1 sm:mb-2">{card.title}</p>
                        <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">{card.value}</p>
                        <div className={`${card.color} p-2 sm:p-3 rounded-full`}>
                            <card.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                    </div>
                    {/* Desktop: Original layout with icon on right */}
                    <div className="hidden md:flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-white">{card.title}</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{card.value}</p>
                        </div>
                        <div className={`${card.color} p-3 rounded-lg`}>
                            <card.icon className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

// ========================================================================
// 👁️ TRANSACTION DETAILS MODAL
// ========================================================================
const TransactionDetailsModal: React.FC<{
    transaction: BlockchainTransaction;
    onClose: () => void;
}> = ({ transaction, onClose }) => {
    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString();
    };

    const statusColor = (status: TransactionStatus) => {
        switch (status) {
            case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
            case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'failed': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
                
                <div className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                    <div className={`${PRIMARY_COLOR_CLASS} px-6 py-4`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <Hash className="w-6 h-6 text-white" />
                                <h2 className="text-xl font-bold text-white">Transaction Details</h2>
                            </div>
                            <button onClick={onClose} className="rounded-full p-2 text-white/80 hover:bg-white/20 transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                        <div className="bg-gray-50 dark:bg-gray-800 dark:border-white rounded-xl p-6 space-y-4 border dark:border-white">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-white uppercase mb-1">Transaction ID</label>
                                    <p className="text-sm font-mono bg-white dark:bg-gray-900 dark:text-white dark:border-white px-3 py-2 rounded-lg border dark:border-white">#{transaction.id}</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-white uppercase mb-1">Status</label>
                                    <span className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold border dark:border-white dark:text-white ${statusColor(transaction.status)}`}>
                                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                                    </span>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 dark:text-white uppercase mb-1">Blockchain Hash</label>
                                <p className="text-sm font-mono break-all bg-white dark:bg-gray-900 dark:text-white dark:border-white px-3 py-2 rounded-lg border dark:border-white">{transaction.transaction_hash || 'Not yet generated'}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-white uppercase mb-1">Type</label>
                                    <p className="text-sm capitalize bg-white dark:bg-gray-900 dark:text-white dark:border-white px-3 py-2 rounded-lg border dark:border-white">{transaction.transaction_type.replace('_', ' ')}</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-white uppercase mb-1">Initiated By</label>
                                    <p className="text-sm bg-white dark:bg-gray-900 dark:text-white dark:border-white px-3 py-2 rounded-lg border dark:border-white">{transaction.initiator?.name || `User #${transaction.initiated_by}`}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-white uppercase mb-1">Submitted At</label>
                                    <p className="text-sm bg-white dark:bg-gray-900 dark:text-white dark:border-white px-3 py-2 rounded-lg border dark:border-white">{formatDate(transaction.submitted_at)}</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-white uppercase mb-1">Processing Time</label>
                                    <p className="text-sm bg-white dark:bg-gray-900 dark:text-white dark:border-white px-3 py-2 rounded-lg border dark:border-white font-semibold">{transaction.processing_time_human || 'N/A'}</p>
                                </div>
                            </div>

                            {transaction.certificate && (
                                <div className="border-t dark:border-white pt-4 mt-4">
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-white uppercase mb-2">Related Certificate</label>
                                    <div className="bg-white dark:bg-gray-900 dark:text-white dark:border-white rounded-lg border dark:border-white p-4 space-y-2">
                                        <p><strong>Title:</strong> {transaction.certificate.title}</p>
                                        <p><strong>Certificate #:</strong> {transaction.certificate.certificate_number}</p>
                                        <p><strong>Student:</strong> {transaction.certificate.student?.full_name}</p>
                                    </div>
                                </div>
                            )}

                            {transaction.attendance && (
                                <div className="border-t dark:border-white pt-4 mt-4">
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-white uppercase mb-2">Attendance Details</label>
                                    <div className="bg-white dark:bg-gray-900 dark:text-white dark:border-white rounded-lg border dark:border-white p-4 space-y-2">
                                        <p><strong>Student:</strong> {transaction.attendance.student?.full_name || `${transaction.attendance.student?.first_name} ${transaction.attendance.student?.last_name}`}</p>
                                        <p><strong>Subject:</strong> {transaction.attendance.class_subject?.subject?.subject_name || 'N/A'}</p>
                                        <p><strong>Date:</strong> {new Date(transaction.attendance.attendance_date).toLocaleDateString()}</p>
                                        <p>
                                            <strong>Status:</strong>{' '}
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold dark:border-white dark:text-white ${
                                                transaction.attendance.status === 'Present' ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900' :
                                                transaction.attendance.status === 'Absent' ? 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900' :
                                                transaction.attendance.status === 'Late' ? 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900' :
                                                'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900'
                                            } border dark:border-white`}>
                                                {transaction.attendance.status}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            )}

                            {transaction.grade && (
                                <div className="border-t dark:border-white pt-4 mt-4">
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-white uppercase mb-2">Grade Details</label>
                                    <div className="bg-white dark:bg-gray-900 dark:text-white dark:border-white rounded-lg border dark:border-white p-4 space-y-2">
                                        <p><strong>Student:</strong> {transaction.grade.student?.full_name || `${transaction.grade.student?.first_name} ${transaction.grade.student?.last_name}`}</p>
                                        <p><strong>Subject:</strong> {transaction.grade.class_subject?.subject?.subject_name || 'N/A'}</p>
                                        {transaction.grade.prelim_grade !== null && transaction.grade.prelim_grade !== undefined && (
                                            <p><strong>Prelim Grade:</strong> {transaction.grade.prelim_grade}</p>
                                        )}
                                        {transaction.grade.midterm_grade !== null && transaction.grade.midterm_grade !== undefined && (
                                            <p><strong>Midterm Grade:</strong> {transaction.grade.midterm_grade}</p>
                                        )}
                                        {transaction.grade.final_grade !== null && transaction.grade.final_grade !== undefined && (
                                            <p><strong>Final Grade:</strong> {transaction.grade.final_grade}</p>
                                        )}
                                        {transaction.grade.final_rating !== null && transaction.grade.final_rating !== undefined && (
                                            <p><strong>Final Rating:</strong> {transaction.grade.final_rating}</p>
                                        )}
                                        {transaction.grade.remarks && (
                                            <p>
                                                <strong>Remarks:</strong>{' '}
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold dark:border-white dark:text-white ${
                                                    transaction.grade.remarks === 'Passed' ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900' :
                                                    transaction.grade.remarks === 'Failed' ? 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900' :
                                                    'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900'
                                                } border dark:border-white`}>
                                                    {transaction.grade.remarks}
                                                </span>
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ========================================================================
// 📜 CERTIFICATE DETAILS MODAL
// ========================================================================
const CertificateDetailsModal: React.FC<{
    certificate: Certificate;
    onClose: () => void;
}> = ({ certificate, onClose }) => {
    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-100 dark:bg-gray-900">
            <div className="relative min-h-full">
                {/* Close button */}
                <button 
                    onClick={onClose}
                    className="fixed top-4 right-4 z-50 p-3 bg-white dark:bg-gray-800 dark:border-white dark:text-white rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border dark:border-white"
                    title="Close"
                >
                    <X className="h-6 w-6 text-gray-700 dark:text-white" />
                </button>
                
                {/* Certificate Template */}
                <CertificateTemplate 
                    certificate={{
                        ...certificate,
                        blockchain_tx_hash: certificate.blockchainTransaction?.transaction_hash
                    }}
                    showActions={true}
                    onClose={onClose}
                />
            </div>
        </div>
    );
};

// ========================================================================
// 🔍 VERIFICATION UTILITY
// ========================================================================
const VerificationUtility: React.FC<{
    onNotification: (notif: Notification) => void;
    onVerificationSuccess: () => void;
}> = ({ onNotification, onVerificationSuccess }) => {
    const [verificationCode, setVerificationCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<Certificate | null>(null);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setResult(null);
        try {
            const response = await adminBlockchainService.verifyCertificate(verificationCode.trim());
            setResult(response.data.certificate);
            onVerificationSuccess();
            onNotification({ type: 'success', message: 'Certificate verified successfully!' });
        } catch (error: any) {
            setResult(null);
            onNotification({ type: 'error', message: error.message || 'Verification failed' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 dark:border-white rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-white">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <Shield className={`w-5 h-5 mr-2 ${TEXT_COLOR_CLASS}`} />
                Certificate Verification
            </h2>
            <form onSubmit={handleVerify} className="flex space-x-4 mb-4">
                <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className={`flex-1 px-4 py-3 border border-gray-200 dark:border-white dark:bg-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS}`}
                    placeholder="Enter Certificate Number (e.g., CERT-2024-ABC123)"
                    required
                />
                <button
                    type="submit"
                    className={`px-6 py-3 ${PRIMARY_COLOR_CLASS} text-white rounded-xl ${HOVER_COLOR_CLASS} font-medium disabled:opacity-50`}
                    disabled={loading || !verificationCode.trim()}
                >
                    {loading ? 'Verifying...' : 'Verify'}
                </button>
            </form>
            
            {result && (
                <div className="bg-green-50 dark:bg-green-900 dark:border-white border-l-4 border-green-500 dark:border-white p-4 rounded-lg">
                    <div className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-white mt-0.5 mr-3" />
                        <div>
                            <p className="font-bold text-green-900 dark:text-white">Certificate Valid ✓</p>
                            <ul className="mt-2 text-sm text-green-800 dark:text-white space-y-1">
                                <li><strong>Title:</strong> {result.title}</li>
                                <li><strong>Student:</strong> {result.student?.full_name}</li>
                                <li><strong>Issued:</strong> {new Date(result.date_issued).toLocaleDateString()}</li>
                                <li><strong>Certificate #:</strong> {result.certificate_number}</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ========================================================================
// 🏠 MAIN BLOCKCHAIN MANAGEMENT COMPONENT
// ========================================================================
const BlockchainManagement: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('transactions');
    const [notification, setNotification] = useState<Notification | null>(null);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState<BlockchainStats>({
        total_transactions: 0,
        pending_count: 0,
        confirmed_count: 0,
        failed_count: 0,
        success_rate: 0,
        total_certificates: 0,
        verified_certificates: 0,
        pending_certificates: 0,
    });

    // Transaction state
    const [transactions, setTransactions] = useState<BlockchainTransaction[]>([]);
    const [transactionFilters, setTransactionFilters] = useState({
        search: '',
        status: '' as TransactionStatus | '',
        type: '' as TransactionType | '',
        page: 1,
        per_page: 10,
    });
    const [transactionPagination, setTransactionPagination] = useState<PaginationData>({
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
    });
    const [selectedTransaction, setSelectedTransaction] = useState<BlockchainTransaction | null>(null);
    const [showTransactionModal, setShowTransactionModal] = useState(false);

    // Certificate state
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [certificateFilters, setCertificateFilters] = useState({
        search: '',
        type: '' as CertificateType | '',
        student_id: '',
        page: 1,
        per_page: 10,
    });
    const [certificatePagination, setCertificatePagination] = useState<PaginationData>({
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
    });
    const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
    const [showCertificateModal, setShowCertificateModal] = useState(false);
    const [showCreateCertificateModal, setShowCreateCertificateModal] = useState(false);
    const [students, setStudents] = useState<Student[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loadingOptions, setLoadingOptions] = useState(false);
    const [certificateFormData, setCertificateFormData] = useState<CertificateFormData>({
        student_id: 0,
        issued_by: 0,
        certificate_type: 'Completion',
        title: '',
        date_issued: new Date().toISOString().split('T')[0],
    });

    // Verification history state
    const [verifications, setVerifications] = useState<CertificateVerification[]>([]);
    const [verificationPagination, setVerificationPagination] = useState<PaginationData>({
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
    });

    // Load stats
    const loadStats = async () => {
        try {
            const response = await adminBlockchainService.getStats();
            setStats(response.data);
        } catch (error: any) {
            console.error('Failed to load stats:', error);
        }
    };

    // Load transactions
    const loadTransactions = async () => {
        setLoading(true);
        try {
            const response = await adminBlockchainService.getTransactions(transactionFilters);
            setTransactions(response.data);
            if (response.pagination) {
                setTransactionPagination(response.pagination);
            }
        } catch (error: any) {
            setNotification({ type: 'error', message: error.message || 'Failed to load transactions' });
        } finally {
            setLoading(false);
        }
    };

    // Load certificates
    const loadCertificates = async () => {
        setLoading(true);
        try {
            const response = await adminBlockchainService.getCertificates(certificateFilters);
            setCertificates(response.data);
            if (response.pagination) {
                setCertificatePagination(response.pagination);
            }
        } catch (error: any) {
            setNotification({ type: 'error', message: error.message || 'Failed to load certificates' });
        } finally {
            setLoading(false);
        }
    };

    // Load verification history
    const loadVerifications = async () => {
        setLoading(true);
        try {
            const response = await adminBlockchainService.getVerificationHistory({ page: 1, per_page: 10 });
            setVerifications(response.data);
            if (response.pagination) {
                setVerificationPagination(response.pagination);
            }
        } catch (error: any) {
            setNotification({ type: 'error', message: error.message || 'Failed to load verification history' });
        } finally {
            setLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        loadStats();
    }, []);

    useEffect(() => {
        if (activeTab === 'transactions') {
            loadTransactions();
        } else if (activeTab === 'certificates') {
            loadCertificates();
            if (students.length === 0 || teachers.length === 0) {
                loadStudentsAndTeachers();
            }
        } else if (activeTab === 'verify') {
            loadVerifications();
        }
    }, [activeTab, transactionFilters.page, certificateFilters.page]);

    // Handlers
    const handleRetryTransaction = async (id: number) => {
        try {
            await adminBlockchainService.retryTransaction(id);
            setNotification({ type: 'success', message: 'Transaction retry initiated' });
            loadTransactions();
            loadStats();
        } catch (error: any) {
            setNotification({ type: 'error', message: error.message || 'Failed to retry transaction' });
        }
    };

    const handleDeleteCertificate = async (id: number) => {
        if (!confirm('Are you sure you want to delete this certificate? This action cannot be undone.')) return;
        try {
            await adminBlockchainService.deleteCertificate(id);
            setNotification({ type: 'success', message: 'Certificate deleted successfully' });
            loadCertificates();
            loadStats();
        } catch (error: any) {
            setNotification({ type: 'error', message: error.message || 'Failed to delete certificate' });
        }
    };

    const handleRegisterOnBlockchain = async (id: number) => {
        try {
            await adminBlockchainService.registerCertificateOnBlockchain(id);
            setNotification({ type: 'success', message: 'Certificate registered on blockchain' });
            loadCertificates();
            loadStats();
        } catch (error: any) {
            setNotification({ type: 'error', message: error.message || 'Failed to register on blockchain' });
        }
    };

    const loadStudentsAndTeachers = async () => {
        setLoadingOptions(true);
        try {
            const [studentsRes, teachersRes] = await Promise.all([
                adminStudentService.getStudents({ per_page: 9999 }),
                adminTeacherService.getTeachers({ per_page: 9999 }),
            ]);

            if (studentsRes.success) {
                setStudents(studentsRes.data || []);
            }
            if (teachersRes.success) {
                setTeachers(teachersRes.data || []);
            }
        } catch (error: any) {
            console.error('Failed to load students/teachers:', error);
        } finally {
            setLoadingOptions(false);
        }
    };

    const handleCreateCertificate = async () => {
        if (!certificateFormData.student_id || !certificateFormData.issued_by || !certificateFormData.title) {
            setNotification({ type: 'error', message: 'Please fill in all required fields' });
            return;
        }

        if (certificateFormData.student_id === 0 || certificateFormData.issued_by === 0) {
            setNotification({ type: 'error', message: 'Please select both a student and a teacher' });
            return;
        }

        try {
            console.log('Creating certificate with data:', certificateFormData);
            const response = await adminBlockchainService.createCertificate(certificateFormData);
            console.log('Certificate created successfully:', response);
            setNotification({ type: 'success', message: response.message || 'Certificate created successfully' });
            setShowCreateCertificateModal(false);
            setCertificateFormData({
                student_id: 0,
                issued_by: 0,
                certificate_type: 'Completion',
                title: '',
                date_issued: new Date().toISOString().split('T')[0],
            });
            loadCertificates();
            loadStats();
        } catch (error: any) {
            console.error('Certificate creation error:', error);
            const errorMessage = error.message || error.error || 'Failed to create certificate. Please check the console for details.';
            setNotification({ type: 'error', message: errorMessage });
        }
    };

    // Status badge rendering
    const renderStatusBadge = (status: TransactionStatus) => {
        const colors = {
            confirmed: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-white dark:border-white',
            pending: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-white dark:border-white',
            failed: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-white dark:border-white',
        };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border dark:border-white ${colors[status]}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    // Pagination component
    const Pagination: React.FC<{ pagination: PaginationData; onPageChange: (page: number) => void }> = ({ pagination, onPageChange }) => {
        if (pagination.last_page <= 1) return null;

        return (
            <div className="bg-gray-50 dark:bg-gray-800 dark:border-white px-6 py-4 border-t border-gray-200 dark:border-white flex items-center justify-between">
                <div className="text-sm text-gray-700 dark:text-white">
                    Showing <span className="font-semibold">{((pagination.current_page - 1) * pagination.per_page) + 1}</span> to{' '}
                    <span className="font-semibold">{Math.min(pagination.current_page * pagination.per_page, pagination.total)}</span> of{' '}
                    <span className="font-semibold">{pagination.total}</span> results
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={() => onPageChange(pagination.current_page - 1)}
                        disabled={pagination.current_page === 1}
                        className="px-4 py-2 border border-gray-300 dark:border-white dark:text-white dark:bg-gray-900 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => onPageChange(pagination.current_page + 1)}
                        disabled={pagination.current_page === pagination.last_page}
                        className="px-4 py-2 border border-gray-300 dark:border-white dark:text-white dark:bg-gray-900 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        Next
                    </button>
                </div>
            </div>
        );
    };

    return (
        <AppLayout>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-900">
                <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
                    {/* Header */}
                    <div className="mb-4 sm:mb-6 md:mb-8">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 sm:mb-6">
                            <div className="mb-4 sm:mb-6 md:mb-0">
                                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-1 sm:mb-2">
                                    Blockchain Management
                                </h1>
                                <p className="text-xs sm:text-sm text-gray-600 dark:text-white">Manage blockchain transactions and certificate verification</p>
                            </div>
                            <button
                                onClick={() => {
                                    loadStats();
                                    if (activeTab === 'transactions') loadTransactions();
                                    else if (activeTab === 'certificates') loadCertificates();
                                    else loadVerifications();
                                }}
                                className="flex items-center px-3 sm:px-4 py-2 bg-gray-200 dark:bg-gray-800 dark:border-white dark:text-white text-gray-700 rounded-lg sm:rounded-xl hover:bg-gray-300 dark:hover:bg-gray-700 transition-all text-xs sm:text-sm border dark:border-white"
                            >
                                <RefreshCw className="w-4 h-4 mr-1 sm:mr-2" />
                                Refresh
                            </button>
                        </div>

                        {/* Stats */}
                        <StatsCards stats={stats} />
                    </div>

                    {/* Tabs */}
                    <div className="bg-white dark:bg-gray-800 dark:border-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 dark:border-white mb-4 sm:mb-6">
                        <div className="flex border-b border-gray-200 dark:border-white">
                            <button
                                onClick={() => setActiveTab('transactions')}
                                className={`flex-1 px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 font-semibold transition-all text-xs sm:text-sm md:text-base ${
                                    activeTab === 'transactions'
                                        ? 'border-b-2 border-purple-600 dark:border-white text-purple-600 dark:text-white bg-purple-50 dark:bg-gray-900'
                                        : 'text-gray-600 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                            >
                                <Hash className="w-4 h-4 sm:w-5 sm:h-5 inline mr-1 sm:mr-2" />
                                <span className="hidden sm:inline">Transactions</span>
                                <span className="sm:hidden">Txns</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('certificates')}
                                className={`flex-1 px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 font-semibold transition-all text-xs sm:text-sm md:text-base ${
                                    activeTab === 'certificates'
                                        ? 'border-b-2 border-purple-600 dark:border-white text-purple-600 dark:text-white bg-purple-50 dark:bg-gray-900'
                                        : 'text-gray-600 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                            >
                                <Award className="w-4 h-4 sm:w-5 sm:h-5 inline mr-1 sm:mr-2" />
                                <span className="hidden sm:inline">Certificates</span>
                                <span className="sm:hidden">Certs</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('verify')}
                                className={`flex-1 px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 font-semibold transition-all text-xs sm:text-sm md:text-base ${
                                    activeTab === 'verify'
                                        ? 'border-b-2 border-purple-600 dark:border-white text-purple-600 dark:text-white bg-purple-50 dark:bg-gray-900'
                                        : 'text-gray-600 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                            >
                                <Shield className="w-4 h-4 sm:w-5 sm:h-5 inline mr-1 sm:mr-2" />
                                Verify
                            </button>
                        </div>
                    </div>

                    {/* Content based on active tab */}
                    {activeTab === 'transactions' && (
                        <>
                            {/* Filters - Compact on Mobile */}
                            <div className="bg-white dark:bg-gray-800 dark:border-white rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 border border-gray-100 dark:border-white">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                                        <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-white" />
                                    </div>
                                    <input
                                        type="text"
                                        value={transactionFilters.search}
                                        onChange={(e) => setTransactionFilters({...transactionFilters, search: e.target.value, page: 1})}
                                        className={`pl-10 sm:pl-12 w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 border border-gray-200 dark:border-white dark:bg-gray-900 dark:text-white rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} text-sm sm:text-base`}
                                        placeholder="Search transactions..."
                                    />
                                </div>
                            </div>

                            {/* Transactions Table - Responsive */}
                            <div className="bg-white dark:bg-gray-800 dark:border-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-white">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-white">
                                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-900 dark:border-white">
                                            <tr>
                                                <th className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 dark:text-white uppercase whitespace-nowrap">ID</th>
                                                <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 dark:text-white uppercase whitespace-nowrap">Hash</th>
                                                <th className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 dark:text-white uppercase whitespace-nowrap">Type</th>
                                                <th className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 dark:text-white uppercase whitespace-nowrap">Status</th>
                                                <th className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 dark:text-white uppercase whitespace-nowrap">Submitted</th>
                                                <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-right text-xs font-bold text-gray-700 dark:text-white uppercase whitespace-nowrap">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-white">
                                            {loading ? (
                                                <tr>
                                                    <td colSpan={6} className="px-3 sm:px-6 py-8 sm:py-12 text-center">
                                                        <div className="flex justify-center">
                                                            <RefreshCw className={`h-6 w-6 sm:h-8 sm:w-8 ${TEXT_COLOR_CLASS} animate-spin`} />
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : transactions.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="px-3 sm:px-6 py-8 sm:py-12 text-center text-gray-500 dark:text-white">
                                                        <div className="flex flex-col items-center">
                                                            <Hash className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 dark:text-white mb-3 sm:mb-4" />
                                                            <p className="text-base sm:text-lg font-medium dark:text-white">No transactions found</p>
                                                            <p className="text-xs sm:text-sm dark:text-white">Try adjusting your search or filters</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                transactions.map((tx) => (
                                                    <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                                        <td className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap font-mono text-xs sm:text-sm dark:text-white">#{tx.id}</td>
                                                        <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                                                            <div className="font-mono text-xs sm:text-sm text-gray-900 dark:text-white truncate">
                                                                {tx.transaction_hash ? `${tx.transaction_hash.substring(0, 12)}...` : 'Pending'}
                                                            </div>
                                                            {/* Show additional info on mobile */}
                                                            <div className="md:hidden mt-1 space-y-1">
                                                                <div className="text-xs text-gray-600 dark:text-white capitalize">{tx.transaction_type.replace('_', ' ')}</div>
                                                                <div className="flex items-center gap-2">
                                                                    {renderStatusBadge(tx.status)}
                                                                    <span className="text-xs text-gray-600 dark:text-white">{new Date(tx.submitted_at).toLocaleDateString()}</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm capitalize dark:text-white">
                                                            {tx.transaction_type.replace('_', ' ')}
                                                        </td>
                                                        <td className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">{renderStatusBadge(tx.status)}</td>
                                                        <td className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm dark:text-white">
                                                            {new Date(tx.submitted_at).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap text-right">
                                                            <div className="flex justify-end space-x-1 sm:space-x-2">
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedTransaction(tx);
                                                                        setShowTransactionModal(true);
                                                                    }}
                                                                    className="p-1.5 sm:p-2 text-blue-600 dark:text-white hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-colors border dark:border-white"
                                                                    title="View Details"
                                                                >
                                                                    <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                                                                </button>
                                                                {tx.status === 'failed' && (
                                                                    <button
                                                                        onClick={() => handleRetryTransaction(tx.id)}
                                                                        className="p-1.5 sm:p-2 text-orange-600 dark:text-white hover:bg-orange-50 dark:hover:bg-gray-700 rounded-lg transition-colors border dark:border-white"
                                                                        title="Retry"
                                                                    >
                                                                        <Zap className="h-4 w-4 sm:h-5 sm:w-5" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <Pagination 
                                    pagination={transactionPagination} 
                                    onPageChange={(page) => setTransactionFilters({...transactionFilters, page})} 
                                />
                            </div>
                        </>
                    )}

                    {activeTab === 'certificates' && (
                        <>
                            {/* Header with Create Button */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6">
                                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-0">Certificates</h2>
                                <button
                                    onClick={() => {
                                        if (students.length === 0 || teachers.length === 0) {
                                            loadStudentsAndTeachers();
                                        }
                                        setShowCreateCertificateModal(true);
                                    }}
                                    className={`flex items-center px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 ${PRIMARY_COLOR_CLASS} text-white rounded-lg sm:rounded-xl hover:opacity-90 transition-all text-xs sm:text-sm md:text-base`}
                                >
                                    <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                                    <span className="hidden sm:inline">Create Certificate</span>
                                    <span className="sm:hidden">Create</span>
                                </button>
                            </div>

                            {/* Filters - Compact on Mobile */}
                            <div className="bg-white dark:bg-gray-800 dark:border-white rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 border border-gray-100 dark:border-white">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                                            <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-white" />
                                        </div>
                                        <input
                                            type="text"
                                            value={certificateFilters.search}
                                            onChange={(e) => setCertificateFilters({...certificateFilters, search: e.target.value, page: 1})}
                                            className={`pl-10 sm:pl-12 w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 border border-gray-200 dark:border-white dark:bg-gray-900 dark:text-white rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} text-sm sm:text-base`}
                                            placeholder="Search certificates..."
                                        />
                                    </div>
                                    <select
                                        value={certificateFilters.type}
                                        onChange={(e) => setCertificateFilters({...certificateFilters, type: e.target.value as CertificateType | '', page: 1})}
                                        className={`px-4 py-3 border border-gray-200 dark:border-white dark:bg-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS}`}
                                    >
                                        <option value="">All Types</option>
                                        <option value="Completion">Completion</option>
                                        <option value="Achievement">Achievement</option>
                                        <option value="Maritime Certificate">Maritime Certificate</option>
                                    </select>
                                    <input
                                        type="text"
                                        value={certificateFilters.student_id}
                                        onChange={(e) => setCertificateFilters({...certificateFilters, student_id: e.target.value, page: 1})}
                                        className={`px-4 py-3 border border-gray-200 dark:border-white dark:bg-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS}`}
                                        placeholder="Filter by Student ID"
                                    />
                                </div>
                            </div>

                            {/* Certificates Table */}
                            <div className="bg-white dark:bg-gray-800 dark:border-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-white">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-white">
                                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-900 dark:border-white">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-white uppercase">Certificate #</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-white uppercase">Title</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-white uppercase">Student</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-white uppercase">Type</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-white uppercase">Date Issued</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-white uppercase">Blockchain</th>
                                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-white uppercase">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-white">
                                            {loading ? (
                                                <tr><td colSpan={7} className="px-6 py-12 text-center"><RefreshCw className={`h-8 w-8 ${TEXT_COLOR_CLASS} animate-spin mx-auto`} /></td></tr>
                                            ) : certificates.length === 0 ? (
                                                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-white">No certificates found</td></tr>
                                            ) : (
                                                certificates.map((cert) => (
                                                    <tr key={cert.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                                        <td className="px-6 py-4 whitespace-nowrap font-mono text-sm dark:text-white">{cert.certificate_number}</td>
                                                        <td className="px-6 py-4 font-semibold text-sm dark:text-white">{cert.title}</td>
                                                        <td className="px-6 py-4 text-sm dark:text-white">{cert.student?.full_name}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm dark:text-white">{cert.certificate_type}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm dark:text-white">
                                                            {new Date(cert.date_issued).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            {cert.blockchain_hash ? (
                                                                <span className="flex items-center text-green-600 dark:text-white text-sm">
                                                                    <CheckCircle className="w-4 h-4 mr-1" />
                                                                    Verified
                                                                </span>
                                                            ) : (
                                                                <button
                                                                    onClick={() => handleRegisterOnBlockchain(cert.id)}
                                                                    className="text-orange-600 dark:text-white text-sm hover:underline flex items-center border dark:border-white px-2 py-1 rounded"
                                                                >
                                                                    <Clock className="w-4 h-4 mr-1" />
                                                                    Register
                                                                </button>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                                            <div className="flex justify-end space-x-2">
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedCertificate(cert);
                                                                        setShowCertificateModal(true);
                                                                    }}
                                                                    className="p-2 text-blue-600 dark:text-white hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg border dark:border-white"
                                                                    title="View Details"
                                                                >
                                                                    <Eye className="h-5 w-5" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteCertificate(cert.id)}
                                                                    className="p-2 text-red-600 dark:text-white hover:bg-red-50 dark:hover:bg-gray-700 rounded-lg border dark:border-white"
                                                                    title="Delete"
                                                                >
                                                                    <Trash2 className="h-5 w-5" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <Pagination 
                                    pagination={certificatePagination} 
                                    onPageChange={(page) => setCertificateFilters({...certificateFilters, page})} 
                                />
                            </div>
                        </>
                    )}

                    {activeTab === 'verify' && (
                        <>
                            {/* Verification Utility */}
                            <VerificationUtility 
                                onNotification={setNotification}
                                onVerificationSuccess={loadVerifications}
                            />

                            {/* Verification History */}
                            <div className="mt-6 bg-white dark:bg-gray-800 dark:border-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-white">
                                <div className="px-6 py-4 border-b border-gray-200 dark:border-white">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Verification History</h2>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-white">
                                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-900 dark:border-white">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-white uppercase">ID</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-white uppercase">Certificate</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-white uppercase">Verified By</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-white uppercase">Verified At</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-white">
                                            {loading ? (
                                                <tr><td colSpan={4} className="px-6 py-12 text-center"><RefreshCw className={`h-8 w-8 ${TEXT_COLOR_CLASS} animate-spin mx-auto`} /></td></tr>
                                            ) : verifications.length === 0 ? (
                                                <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500 dark:text-white">No verification history</td></tr>
                                            ) : (
                                                verifications.map((ver) => (
                                                    <tr key={ver.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                                        <td className="px-6 py-4 whitespace-nowrap font-mono text-sm dark:text-white">#{ver.id}</td>
                                                        <td className="px-6 py-4 text-sm dark:text-white">{ver.certificate?.title || 'N/A'}</td>
                                                        <td className="px-6 py-4 text-sm dark:text-white">{ver.verified_by_name || 'Public Lookup'}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm dark:text-white">
                                                            {new Date(ver.verified_at).toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <Pagination 
                                    pagination={verificationPagination} 
                                    onPageChange={(page) => {/* Implement pagination for verifications */}} 
                                />
                            </div>
                        </>
                    )}

                    {/* Modals */}
                    {showTransactionModal && selectedTransaction && (
                        <TransactionDetailsModal
                            transaction={selectedTransaction}
                            onClose={() => setShowTransactionModal(false)}
                        />
                    )}

                    {showCertificateModal && selectedCertificate && (
                        <CertificateDetailsModal
                            certificate={selectedCertificate}
                            onClose={() => setShowCertificateModal(false)}
                        />
                    )}

                    {/* Create Certificate Modal */}
                    {showCreateCertificateModal && (
                        <div className="fixed inset-0 z-50 overflow-y-auto">
                            <div className="flex min-h-full items-center justify-center p-4">
                                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setShowCreateCertificateModal(false)}></div>
                                
                                <div className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 dark:border-white shadow-2xl transition-all border dark:border-white">
                                    <div className={`${PRIMARY_COLOR_CLASS} px-6 py-4`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <Plus className="w-6 h-6 text-white" />
                                                <h2 className="text-xl font-bold text-white">Create New Certificate</h2>
                                            </div>
                                            <button onClick={() => setShowCreateCertificateModal(false)} className="rounded-full p-2 text-white/80 hover:bg-white/20 transition-colors">
                                                <X className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-6 space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 dark:text-white mb-2">Student *</label>
                                                <select
                                                    value={certificateFormData.student_id}
                                                    onChange={(e) => setCertificateFormData({...certificateFormData, student_id: parseInt(e.target.value)})}
                                                    className="w-full px-4 py-3 border border-gray-200 dark:border-white dark:bg-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                    required
                                                    disabled={loadingOptions}
                                                >
                                                    <option value={0}>Select Student</option>
                                                    {students.map(student => (
                                                        <option key={student.id} value={student.id}>
                                                            {student.full_name} ({student.student_id})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 dark:text-white mb-2">Issued By (Teacher) *</label>
                                                <select
                                                    value={certificateFormData.issued_by}
                                                    onChange={(e) => setCertificateFormData({...certificateFormData, issued_by: parseInt(e.target.value)})}
                                                    className="w-full px-4 py-3 border border-gray-200 dark:border-white dark:bg-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                    required
                                                    disabled={loadingOptions}
                                                >
                                                    <option value={0}>Select Teacher</option>
                                                    {teachers.map(teacher => (
                                                        <option key={teacher.id} value={teacher.id}>
                                                            {teacher.full_name || `${teacher.first_name} ${teacher.last_name}`}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 dark:text-white mb-2">Certificate Type *</label>
                                                <select
                                                    value={certificateFormData.certificate_type}
                                                    onChange={(e) => setCertificateFormData({...certificateFormData, certificate_type: e.target.value as CertificateType})}
                                                    className="w-full px-4 py-3 border border-gray-200 dark:border-white dark:bg-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                    required
                                                >
                                                    <option value="Completion">Completion</option>
                                                    <option value="Achievement">Achievement</option>
                                                    <option value="Maritime Certificate">Maritime Certificate</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 dark:text-white mb-2">Date Issued *</label>
                                                <input
                                                    type="date"
                                                    value={certificateFormData.date_issued}
                                                    onChange={(e) => setCertificateFormData({...certificateFormData, date_issued: e.target.value})}
                                                    className="w-full px-4 py-3 border border-gray-200 dark:border-white dark:bg-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-white mb-2">Certificate Title *</label>
                                            <input
                                                type="text"
                                                value={certificateFormData.title}
                                                onChange={(e) => setCertificateFormData({...certificateFormData, title: e.target.value})}
                                                className="w-full px-4 py-3 border border-gray-200 dark:border-white dark:bg-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                placeholder="e.g., Certificate of Completion - BS Marine Transportation"
                                                required
                                            />
                                        </div>

                                        <div className="flex justify-end space-x-3 pt-4 border-t dark:border-white">
                                            <button
                                                onClick={() => setShowCreateCertificateModal(false)}
                                                className="px-6 py-2 border border-gray-300 dark:border-white dark:text-white dark:bg-gray-900 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleCreateCertificate}
                                                className={`px-6 py-2 ${PRIMARY_COLOR_CLASS} text-white rounded-lg hover:opacity-90 transition-all`}
                                            >
                                                Create Certificate
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Notification */}
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

export default BlockchainManagement;