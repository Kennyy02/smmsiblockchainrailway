import React, { useState } from 'react';
import { Shield, CheckCircle, XCircle, Search, Award, User, Calendar, Hash, Download, Copy, ArrowLeft } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { router } from '@inertiajs/react';

const PRIMARY_COLOR_CLASS = 'bg-gradient-to-r from-purple-600 to-indigo-600';
const TEXT_COLOR_CLASS = 'text-purple-600';

interface Certificate {
    id: number;
    certificate_number: string;
    title: string;
    certificate_type: string;
    date_issued: string;
    blockchain_hash: string | null;
    blockchain_timestamp: string | null;
    student: {
        id: number;
        student_id: string;
        full_name: string;
    };
    issuer: {
        id: number;
        full_name: string;
    };
}

interface VerificationResult {
    certificate: Certificate;
    verification_record: {
        id: number;
        verified_at: string;
    };
    integrity_verified: boolean;
}

const CertificateVerification: React.FC = () => {
    const [certificateNumber, setCertificateNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<VerificationResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await fetch('/api/blockchain/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    certificate_number: certificateNumber.trim(),
                    verified_by_name: 'Public Verification',
                }),
            });

            const data = await response.json();

            if (data.success) {
                setResult(data.data);
            } else {
                setError(data.message || 'Certificate verification failed');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to verify certificate. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
            <div className="container mx-auto px-4 py-12">
                {/* Back Button */}
                <div className="mb-6">
                    <button
                        onClick={() => router.visit('/')}
                        className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors group cursor-pointer"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-medium">Back to Home</span>
                    </button>
                </div>

                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 mb-6">
                        <Shield className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        Certificate Verification
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Verify the authenticity of certificates issued by Southern Mindoro Maritime School.
                        Enter the certificate number below to verify its validity and blockchain registration.
                    </p>
                </div>

                {/* Verification Form */}
                <div className="max-w-2xl mx-auto mb-8">
                    <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                        <form onSubmit={handleVerify} className="space-y-6">
                            <div>
                                <label htmlFor="certificate-number" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Certificate Number
                                </label>
                                <div className="flex gap-3">
                                    <div className="flex-1 relative">
                                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <input
                                            type="text"
                                            id="certificate-number"
                                            value={certificateNumber}
                                            onChange={(e) => setCertificateNumber(e.target.value)}
                                            className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
                                            placeholder="Enter certificate number (e.g., CERT-2024-ABC123)"
                                            required
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading || !certificateNumber.trim()}
                                        className={`px-8 py-4 ${PRIMARY_COLOR_CLASS} text-white rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
                                    >
                                        {loading ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                Verifying...
                                            </>
                                        ) : (
                                            <>
                                                <Shield className="w-5 h-5" />
                                                Verify
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="max-w-2xl mx-auto mb-8">
                        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-xl">
                            <div className="flex items-start">
                                <XCircle className="w-6 h-6 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="text-lg font-semibold text-red-900 mb-1">Verification Failed</h3>
                                    <p className="text-red-700">{error}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Verification Result */}
                {result && (
                    <div className="max-w-4xl mx-auto">
                        {result.integrity_verified ? (
                            <div className="bg-white rounded-2xl shadow-xl border-2 border-green-200 overflow-hidden">
                                {/* Success Header */}
                                <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                                                <CheckCircle className="w-10 h-10 text-green-600" />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold text-white">Certificate Verified ✓</h2>
                                                <p className="text-green-100 mt-1">This certificate is authentic and registered on the blockchain</p>
                                            </div>
                                        </div>
                                        {result.certificate.blockchain_hash && (
                                            <div className="text-right">
                                                <div className="text-xs text-green-100 uppercase mb-1">Blockchain Status</div>
                                                <div className="text-sm font-mono text-white bg-green-600/30 px-3 py-1 rounded">Verified</div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Certificate Details */}
                                <div className="p-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
                                            <div className="flex items-center mb-4">
                                                <Award className="w-6 h-6 text-purple-600 mr-3" />
                                                <h3 className="text-xl font-bold text-purple-900">{result.certificate.title}</h3>
                                            </div>
                                            <div className="space-y-3 text-sm">
                                                <div>
                                                    <span className="font-semibold text-purple-700">Certificate Number:</span>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="font-mono text-purple-900">{result.certificate.certificate_number}</span>
                                                        <button
                                                            onClick={() => copyToClipboard(result.certificate.certificate_number)}
                                                            className="p-1 hover:bg-purple-200 rounded transition-colors"
                                                            title="Copy"
                                                        >
                                                            <Copy className="w-4 h-4 text-purple-600" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="font-semibold text-purple-700">Type:</span>
                                                    <p className="text-purple-900 mt-1">{result.certificate.certificate_type}</p>
                                                </div>
                                                <div>
                                                    <span className="font-semibold text-purple-700">Date Issued:</span>
                                                    <p className="text-purple-900 mt-1">{formatDate(result.certificate.date_issued)}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200">
                                            <div className="flex items-center mb-4">
                                                <User className="w-6 h-6 text-blue-600 mr-3" />
                                                <h3 className="text-xl font-bold text-blue-900">Student Information</h3>
                                            </div>
                                            <div className="space-y-3 text-sm">
                                                <div>
                                                    <span className="font-semibold text-blue-700">Student Name:</span>
                                                    <p className="text-blue-900 mt-1">{result.certificate.student.full_name}</p>
                                                </div>
                                                <div>
                                                    <span className="font-semibold text-blue-700">Student ID:</span>
                                                    <p className="text-blue-900 mt-1">{result.certificate.student.student_id}</p>
                                                </div>
                                                <div>
                                                    <span className="font-semibold text-blue-700">Issued By:</span>
                                                    <p className="text-blue-900 mt-1">{result.certificate.issuer.full_name}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Blockchain Information */}
                                    {result.certificate.blockchain_hash && (
                                        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 mb-6">
                                            <div className="flex items-center mb-4">
                                                <Hash className="w-6 h-6 text-gray-600 mr-3" />
                                                <h3 className="text-lg font-bold text-gray-900">Blockchain Information</h3>
                                            </div>
                                            <div className="space-y-3">
                                                <div>
                                                    <span className="text-sm font-semibold text-gray-600 block mb-1">Blockchain Hash:</span>
                                                    <div className="flex items-center gap-2">
                                                        <code className="flex-1 font-mono text-xs bg-white px-4 py-3 rounded-lg border border-gray-300 break-all">
                                                            {result.certificate.blockchain_hash}
                                                        </code>
                                                        <button
                                                            onClick={() => copyToClipboard(result.certificate.blockchain_hash || '')}
                                                            className="p-2 hover:bg-gray-200 rounded transition-colors"
                                                            title="Copy Hash"
                                                        >
                                                            <Copy className="w-4 h-4 text-gray-600" />
                                                        </button>
                                                    </div>
                                                </div>
                                                {result.certificate.blockchain_timestamp && (
                                                    <div>
                                                        <span className="text-sm font-semibold text-gray-600 block mb-1">Registered On:</span>
                                                        <p className="text-gray-900">
                                                            <Calendar className="w-4 h-4 inline mr-2" />
                                                            {formatDate(result.certificate.blockchain_timestamp)}
                                                        </p>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-300">
                                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                                    <span className="text-sm font-semibold text-green-700">
                                                        Integrity Verified: Certificate data matches blockchain record
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Verification Record */}
                                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <span className="text-sm font-semibold text-blue-700">Verified At:</span>
                                                <p className="text-blue-900">
                                                    {new Date(result.verification_record.verified_at).toLocaleString()}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => window.print()}
                                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                            >
                                                <Download className="w-4 h-4" />
                                                Print/Download
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl shadow-xl border-2 border-red-200 overflow-hidden">
                                <div className="bg-gradient-to-r from-red-500 to-rose-600 px-8 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                                            <XCircle className="w-10 h-10 text-red-600" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-white">Integrity Check Failed</h2>
                                            <p className="text-red-100 mt-1">Certificate data may have been tampered with</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-8">
                                    <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                                        <p className="text-red-800">
                                            <strong>Warning:</strong> This certificate was found in our system, but the integrity check failed. 
                                            This may indicate that the certificate data has been modified after blockchain registration. 
                                            Please contact the school administration for further verification.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Information Section */}
                <div className="max-w-4xl mx-auto mt-12">
                    <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">How It Works</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Search className="w-8 h-8 text-purple-600" />
                                </div>
                                <h4 className="font-semibold text-gray-900 mb-2">1. Enter Certificate Number</h4>
                                <p className="text-sm text-gray-600">Input the unique certificate number provided on the certificate</p>
                            </div>
                            <div className="text-center">
                                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Shield className="w-8 h-8 text-indigo-600" />
                                </div>
                                <h4 className="font-semibold text-gray-900 mb-2">2. Blockchain Verification</h4>
                                <p className="text-sm text-gray-600">System verifies the certificate against our blockchain records</p>
                            </div>
                            <div className="text-center">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="w-8 h-8 text-green-600" />
                                </div>
                                <h4 className="font-semibold text-gray-900 mb-2">3. Get Results</h4>
                                <p className="text-sm text-gray-600">View detailed certificate information and verification status</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CertificateVerification;

