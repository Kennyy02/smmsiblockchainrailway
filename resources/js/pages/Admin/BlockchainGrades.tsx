import React, { useState, useEffect } from 'react';
import { RefreshCw, Search, Eye, X } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { 
    adminBlockchainService,
    BlockchainTransaction,
    TransactionStatus,
    PaginationData,
} from '../../../services/AdminBlockchainService';

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
                                <Eye className="w-6 h-6 text-white" />
                                <h2 className="text-xl font-bold text-white">Transaction Details</h2>
                            </div>
                            <button onClick={onClose} className="rounded-full p-2 text-white/80 hover:bg-white/20 transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                        <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Transaction ID</label>
                                    <p className="text-sm font-mono bg-white px-3 py-2 rounded-lg border">#{transaction.id}</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Status</label>
                                    <span className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold border ${statusColor(transaction.status)}`}>
                                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                                    </span>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Blockchain Hash</label>
                                <p className="text-sm font-mono break-all bg-white px-3 py-2 rounded-lg border">{transaction.transaction_hash || 'Not yet generated'}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Type</label>
                                    <p className="text-sm capitalize bg-white px-3 py-2 rounded-lg border">{transaction.transaction_type.replace('_', ' ')}</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Initiated By</label>
                                    <p className="text-sm bg-white px-3 py-2 rounded-lg border">{transaction.initiator?.name || `User #${transaction.initiated_by}`}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Submitted At</label>
                                    <p className="text-sm bg-white px-3 py-2 rounded-lg border">{formatDate(transaction.submitted_at)}</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Processing Time</label>
                                    <p className="text-sm bg-white px-3 py-2 rounded-lg border font-semibold">{transaction.processing_time_human || 'N/A'}</p>
                                </div>
                            </div>

                            {transaction.grade && (
                                <div className="border-t pt-4 mt-4">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Grade Details</label>
                                    <div className="bg-white rounded-lg border p-4 space-y-2">
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
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                                    transaction.grade.remarks === 'Passed' ? 'bg-green-100 text-green-800 border-green-200' :
                                                    transaction.grade.remarks === 'Failed' ? 'bg-red-100 text-red-800 border-red-200' :
                                                    'bg-gray-100 text-gray-800 border-gray-200'
                                                } border`}>
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

const BlockchainGrades: React.FC = () => {
    const [notification, setNotification] = useState<Notification | null>(null);
    const [loading, setLoading] = useState(false);
    const [transactions, setTransactions] = useState<BlockchainTransaction[]>([]);
    const [filters, setFilters] = useState({
        search: '',
        page: 1,
        per_page: 10,
    });
    const [pagination, setPagination] = useState<PaginationData>({
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
    });
    const [selectedTransaction, setSelectedTransaction] = useState<BlockchainTransaction | null>(null);
    const [showModal, setShowModal] = useState(false);

    const loadTransactions = async () => {
        setLoading(true);
        try {
            // Get all transactions without type filter, then filter client-side
            const response = await adminBlockchainService.getTransactions({
                ...filters,
                type: '', // No type filter - we'll filter client-side
            });
            
            // Filter for grade-related transactions only
            const gradeTransactions = (response.data || []).filter(tx => 
                tx.transaction_type === 'grade_creation' || tx.transaction_type === 'grade_update'
            );
            
            setTransactions(gradeTransactions);
            if (response.pagination) {
                // Update pagination to reflect filtered results
                setPagination({
                    ...response.pagination,
                    total: gradeTransactions.length,
                });
            }
        } catch (error: any) {
            setNotification({ type: 'error', message: error.message || 'Failed to load transactions' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTransactions();
    }, [filters.page]);

    const renderStatusBadge = (status: TransactionStatus) => {
        const colors = {
            confirmed: 'bg-green-100 text-green-800 border-green-200',
            pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            failed: 'bg-red-100 text-red-800 border-red-200',
        };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${colors[status]}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    const Pagination: React.FC<{ pagination: PaginationData; onPageChange: (page: number) => void }> = ({ pagination, onPageChange }) => {
        if (pagination.last_page <= 1) return null;

        return (
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                    Showing <span className="font-semibold">{((pagination.current_page - 1) * pagination.per_page) + 1}</span> to{' '}
                    <span className="font-semibold">{Math.min(pagination.current_page * pagination.per_page, pagination.total)}</span> of{' '}
                    <span className="font-semibold">{pagination.total}</span> results
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={() => onPageChange(pagination.current_page - 1)}
                        disabled={pagination.current_page === 1}
                        className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => onPageChange(pagination.current_page + 1)}
                        disabled={pagination.current_page === pagination.last_page}
                        className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                    >
                        Next
                    </button>
                </div>
            </div>
        );
    };

    return (
        <AppLayout>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="container mx-auto px-4 py-8">
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                                    Blockchain Grades
                                </h1>
                                <p className="text-gray-600">View all grade-related blockchain transactions</p>
                            </div>
                            <button
                                onClick={loadTransactions}
                                className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Refresh
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
                        <div className="flex items-center">
                            <Search className="absolute ml-4 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                value={filters.search}
                                onChange={(e) => setFilters({...filters, search: e.target.value, page: 1})}
                                className={`pl-12 w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS}`}
                                placeholder="Search transactions..."
                            />
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">ID</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Hash</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Student</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Grade</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Status</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Submitted</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {loading ? (
                                        <tr><td colSpan={7} className="px-6 py-12 text-center"><RefreshCw className={`h-8 w-8 ${TEXT_COLOR_CLASS} animate-spin mx-auto`} /></td></tr>
                                    ) : transactions.length === 0 ? (
                                        <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">No grade transactions found</td></tr>
                                    ) : (
                                        transactions.map((tx) => (
                                            <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">#{tx.id}</td>
                                                <td className="px-6 py-4 font-mono text-xs max-w-xs truncate">
                                                    {tx.transaction_hash ? `${tx.transaction_hash.substring(0, 12)}...` : 'Pending'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {tx.grade?.student?.full_name || `${tx.grade?.student?.first_name} ${tx.grade?.student?.last_name}` || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {tx.grade?.final_rating !== null && tx.grade?.final_rating !== undefined 
                                                        ? tx.grade.final_rating 
                                                        : tx.grade?.final_grade !== null && tx.grade?.final_grade !== undefined
                                                        ? tx.grade.final_grade
                                                        : 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">{renderStatusBadge(tx.status)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {new Date(tx.submitted_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedTransaction(tx);
                                                            setShowModal(true);
                                                        }}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                                        title="View Details"
                                                    >
                                                        <Eye className="h-5 w-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <Pagination 
                            pagination={pagination} 
                            onPageChange={(page) => setFilters({...filters, page})} 
                        />
                    </div>

                    {showModal && selectedTransaction && (
                        <TransactionDetailsModal
                            transaction={selectedTransaction}
                            onClose={() => setShowModal(false)}
                        />
                    )}

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

export default BlockchainGrades;

