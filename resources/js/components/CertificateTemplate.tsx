import React from 'react';
import { Award, CheckCircle, ExternalLink } from 'lucide-react';

interface CertificateTemplateProps {
    certificate: {
        title: string;
        certificate_number: string;
        certificate_type: string;
        student?: {
            full_name: string;
            student_id: string;
        };
        date_issued: string;
        issuer?: {
            full_name: string;
        };
        blockchain_hash?: string;
        blockchain_tx_hash?: string; // Transaction hash from Polygon
    };
    showActions?: boolean;
    onClose?: () => void;
}

const CertificateTemplate: React.FC<CertificateTemplateProps> = ({ 
    certificate, 
    showActions = false,
    onClose 
}) => {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getPolygonExplorerUrl = (txHash: string) => {
        // Mumbai testnet explorer
        return `https://mumbai.polygonscan.com/tx/${txHash}`;
    };

    return (
        <div className="certificate-container">
            {/* Print Styles */}
            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .certificate-container, .certificate-container * {
                        visibility: visible;
                    }
                    .certificate-container {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
                
                .certificate-container {
                    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                    min-height: 100vh;
                    padding: 40px 20px;
                }
                
                .certificate-paper {
                    max-width: 900px;
                    margin: 0 auto;
                    background: #ffffff;
                    border: 8px solid #8b5cf6;
                    border-radius: 4px;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                    position: relative;
                    padding: 60px 80px;
                    background-image: 
                        radial-gradient(circle at 2px 2px, rgba(139, 92, 246, 0.1) 1px, transparent 0);
                    background-size: 40px 40px;
                }
                
                .certificate-border {
                    position: absolute;
                    top: 20px;
                    left: 20px;
                    right: 20px;
                    bottom: 20px;
                    border: 2px solid #8b5cf6;
                    border-radius: 2px;
                    pointer-events: none;
                }
                
                .certificate-seal {
                    position: absolute;
                    top: 30px;
                    right: 30px;
                    width: 120px;
                    height: 120px;
                    border: 4px solid #8b5cf6;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
                    color: white;
                    font-weight: bold;
                    font-size: 14px;
                    text-align: center;
                    padding: 10px;
                }
                
                .certificate-header {
                    text-align: center;
                    margin-bottom: 40px;
                    position: relative;
                }
                
                .school-name {
                    font-size: 32px;
                    font-weight: 700;
                    color: #1e293b;
                    letter-spacing: 2px;
                    margin-bottom: 8px;
                    text-transform: uppercase;
                }
                
                .school-subtitle {
                    font-size: 14px;
                    color: #64748b;
                    letter-spacing: 1px;
                    margin-bottom: 30px;
                }
                
                .certificate-title {
                    font-size: 18px;
                    color: #8b5cf6;
                    font-weight: 600;
                    letter-spacing: 3px;
                    margin-bottom: 50px;
                    text-transform: uppercase;
                }
                
                .certificate-body {
                    text-align: center;
                    margin: 50px 0;
                }
                
                .certificate-text {
                    font-size: 16px;
                    color: #334155;
                    line-height: 1.8;
                    margin-bottom: 30px;
                }
                
                .student-name {
                    font-size: 36px;
                    font-weight: 700;
                    color: #1e293b;
                    margin: 30px 0;
                    text-decoration: underline;
                    text-decoration-color: #8b5cf6;
                    text-decoration-thickness: 3px;
                    text-underline-offset: 10px;
                }
                
                .certificate-description {
                    font-size: 18px;
                    color: #475569;
                    line-height: 1.8;
                    margin: 40px 0;
                    font-style: italic;
                }
                
                .certificate-footer {
                    margin-top: 60px;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                }
                
                .signature-block {
                    text-align: center;
                    flex: 1;
                }
                
                .signature-line {
                    border-top: 2px solid #1e293b;
                    width: 200px;
                    margin: 60px auto 10px;
                }
                
                .signature-name {
                    font-size: 14px;
                    font-weight: 600;
                    color: #1e293b;
                }
                
                .signature-title {
                    font-size: 12px;
                    color: #64748b;
                    margin-top: 4px;
                }
                
                .certificate-number {
                    text-align: center;
                    margin-top: 40px;
                    padding-top: 30px;
                    border-top: 1px solid #e2e8f0;
                }
                
                .cert-number-label {
                    font-size: 11px;
                    color: #64748b;
                    letter-spacing: 1px;
                    text-transform: uppercase;
                    margin-bottom: 8px;
                }
                
                .cert-number-value {
                    font-size: 14px;
                    font-weight: 600;
                    color: #1e293b;
                    font-family: 'Courier New', monospace;
                    letter-spacing: 1px;
                }
                
                .blockchain-verification {
                    margin-top: 30px;
                    padding: 20px;
                    background: linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%);
                    border: 2px solid #8b5cf6;
                    border-radius: 8px;
                    text-align: center;
                }
                
                .verification-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    background: #10b981;
                    color: white;
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-size: 14px;
                    font-weight: 600;
                    margin-bottom: 15px;
                }
                
                .blockchain-hash {
                    font-family: 'Courier New', monospace;
                    font-size: 11px;
                    color: #475569;
                    word-break: break-all;
                    margin: 10px 0;
                }
                
                .blockchain-link {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    color: #8b5cf6;
                    text-decoration: none;
                    font-size: 13px;
                    font-weight: 600;
                    margin-top: 10px;
                }
                
                .blockchain-link:hover {
                    text-decoration: underline;
                }
            `}</style>

            <div className="certificate-paper">
                <div className="certificate-border"></div>
                
                {/* Seal */}
                <div className="certificate-seal">
                    <div>
                        <div style={{ fontSize: '24px', marginBottom: '4px' }}>✓</div>
                        <div style={{ fontSize: '10px' }}>VERIFIED</div>
                    </div>
                </div>

                {/* Header */}
                <div className="certificate-header">
                    <div className="school-name">Southern Mindoro Maritime School</div>
                    <div className="school-subtitle">Blockchain Grading System</div>
                    <div className="certificate-title">
                        {certificate.certificate_type === 'Completion' && 'Certificate of Completion'}
                        {certificate.certificate_type === 'Achievement' && 'Certificate of Achievement'}
                        {certificate.certificate_type === 'Maritime Certificate' && 'Maritime Certificate'}
                    </div>
                </div>

                {/* Body */}
                <div className="certificate-body">
                    <div className="certificate-text">
                        This is to certify that
                    </div>
                    
                    <div className="student-name">
                        {certificate.student?.full_name || 'Student Name'}
                    </div>
                    
                    <div className="certificate-description">
                        {certificate.title}
                    </div>
                    
                    <div className="certificate-text">
                        has successfully completed all requirements and is hereby awarded this certificate
                        on this <strong>{formatDate(certificate.date_issued)}</strong>.
                    </div>
                </div>

                {/* Footer with Signatures */}
                <div className="certificate-footer">
                    <div className="signature-block">
                        <div className="signature-line"></div>
                        <div className="signature-name">
                            {certificate.issuer?.full_name || 'Authorized Signatory'}
                        </div>
                        <div className="signature-title">Issuing Authority</div>
                    </div>
                    
                    <div className="signature-block">
                        <div className="signature-line"></div>
                        <div className="signature-name">Date</div>
                        <div className="signature-title">{formatDate(certificate.date_issued)}</div>
                    </div>
                </div>

                {/* Certificate Number */}
                <div className="certificate-number">
                    <div className="cert-number-label">Certificate Number</div>
                    <div className="cert-number-value">{certificate.certificate_number}</div>
                </div>

                {/* Blockchain Verification */}
                {certificate.blockchain_hash && (
                    <div className="blockchain-verification">
                        <div className="verification-badge">
                            <CheckCircle size={18} />
                            <span>Verified on Polygon Blockchain</span>
                        </div>
                        <div className="blockchain-hash">
                            Hash: {certificate.blockchain_hash}
                        </div>
                        {certificate.blockchain_tx_hash && (
                            <a 
                                href={getPolygonExplorerUrl(certificate.blockchain_tx_hash)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="blockchain-link"
                            >
                                <ExternalLink size={14} />
                                View on PolygonScan
                            </a>
                        )}
                    </div>
                )}
            </div>

            {/* Action Buttons (Hidden on Print) */}
            {showActions && (
                <div className="no-print fixed bottom-6 right-6 flex gap-3 z-50">
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg shadow-lg hover:bg-purple-700 transition-colors"
                    >
                        <Award className="w-5 h-5" />
                        Print Certificate
                    </button>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="px-6 py-3 bg-gray-600 text-white rounded-lg shadow-lg hover:bg-gray-700 transition-colors"
                        >
                            Close
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default CertificateTemplate;

