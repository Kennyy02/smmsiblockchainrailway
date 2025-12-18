import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface DeleteConfirmationModalProps {
    item: {
        id: number;
        full_name: string;
        classes_count: number;
        grades_count: number;
    } | null;
    onClose: () => void;
    onConfirm: (force: boolean) => Promise<void>;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ item, onClose, onConfirm }) => {
    const [loading, setLoading] = useState(false);
    const [forceDelete, setForceDelete] = useState(false);

    if (!item) return null;

    const hasRelatedData = item.classes_count > 0 || item.grades_count > 0;

    const handleConfirm = async () => {
        setLoading(true);
        try {
            await onConfirm(forceDelete);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
                
                <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                    <div className="bg-red-600 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <AlertTriangle className="h-6 w-6 text-white mr-2" />
                                <h2 className="text-xl font-bold text-white">Confirm Delete</h2>
                            </div>
                            <button onClick={onClose} className="rounded-full p-2 text-white/80 hover:bg-white/20 hover:text-white transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    <div className="p-6">
                        <p className="text-gray-700 mb-4">
                            Are you sure you want to delete <strong>{item.full_name}</strong>?
                        </p>

                        {hasRelatedData && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                                <div className="flex items-start">
                                    <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-yellow-800 mb-2">Warning: This item has related data</p>
                                        <ul className="text-sm text-yellow-700 space-y-1">
                                            {item.classes_count > 0 && <li>• {item.classes_count} class(es)</li>}
                                            {item.grades_count > 0 && <li>• {item.grades_count} grade(s)</li>}
                                        </ul>
                                        <div className="mt-3 flex items-center">
                                            <input
                                                type="checkbox"
                                                id="force_delete"
                                                checked={forceDelete}
                                                onChange={(e) => setForceDelete(e.target.checked)}
                                                className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                                            />
                                            <label htmlFor="force_delete" className="ml-2 text-sm font-medium text-yellow-800">
                                                Force delete (this will delete all related data)
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirm}
                                className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-medium shadow-lg disabled:opacity-50"
                                disabled={loading || (hasRelatedData && !forceDelete)}
                            >
                                {loading ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmationModal;

