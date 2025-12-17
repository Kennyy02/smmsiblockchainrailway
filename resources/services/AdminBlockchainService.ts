// ========================================================================
// 🔐 ADMIN BLOCKCHAIN SERVICE - Unified Blockchain Management
// Handles both Blockchain Transactions and Certificate Management
// ========================================================================

// ========================================================================
// 📋 INTERFACE DEFINITIONS
// ========================================================================

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    errors?: any;
}

export interface PaginationData {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

// Minimal User interface for relationships
export interface MinimalUser {
    id: number;
    name: string;
    email: string;
    role: string;
}

// Minimal Student interface
export interface MinimalStudent {
    id: number;
    student_id: string;
    first_name: string;
    last_name: string;
    full_name: string;
}

// Minimal Teacher interface
export interface MinimalTeacher {
    id: number;
    teacher_id: string;
    first_name: string;
    last_name: string;
    full_name: string;
}

// ========================================================================
// 🔗 BLOCKCHAIN TRANSACTION TYPES
// ========================================================================

export type TransactionStatus = 'pending' | 'confirmed' | 'failed';
export type TransactionType = 'certificate_creation' | 'certificate_update' | 'verification';

export interface BlockchainTransaction {
    id: number;
    transaction_hash: string | null;
    transaction_type: TransactionType;
    initiated_by: number;
    status: TransactionStatus;
    submitted_at: string;
    confirmed_at?: string | null;
    created_at: string;
    updated_at: string;
    
    // Computed properties
    processing_time_seconds: number | null;
    processing_time_human: string;
    
    // Relationships
    initiator: MinimalUser;
    certificate?: Certificate;
}

export interface TransactionFilters {
    search?: string;
    status?: TransactionStatus | '';
    type?: TransactionType | '';
    user_id?: number;
    recent?: boolean;
    days?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    page?: number;
    per_page?: number;
}

export interface TransactionsResponse extends ApiResponse<BlockchainTransaction[]> {
    pagination: PaginationData;
}

// ========================================================================
// 📜 CERTIFICATE TYPES
// ========================================================================

export type CertificateType = 'Completion' | 'Achievement' | 'Maritime Certificate';

export interface Certificate {
    id: number;
    certificate_number: string;
    student_id: number;
    issued_by: number;
    certificate_type: CertificateType;
    title: string;
    date_issued: string;
    blockchain_hash: string | null;
    blockchain_timestamp: string | null;
    created_at: string;
    updated_at: string;
    
    // Relationships
    student: MinimalStudent;
    issuer: MinimalTeacher;
    blockchainTransaction?: BlockchainTransaction;
}

export interface CertificateFormData {
    student_id: number;
    issued_by: number;
    certificate_type: CertificateType;
    title: string;
    date_issued: string;
}

export interface CertificateFilters {
    search?: string;
    type?: CertificateType | '';
    student_id?: string | number;
    start_date?: string;
    end_date?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    page?: number;
    per_page?: number;
}

export interface CertificatesResponse extends ApiResponse<Certificate[]> {
    pagination: PaginationData;
}

// ========================================================================
// 🔍 CERTIFICATE VERIFICATION TYPES
// ========================================================================

export interface CertificateVerification {
    id: number;
    certificate_id: number;
    verified_by_name: string | null;
    verified_at: string;
    created_at: string;
    updated_at: string;
    
    // Relationships
    certificate: Certificate;
}

export interface CertificateVerificationResponse extends ApiResponse<null> {
    data: {
        certificate: Certificate;
        verification_record: CertificateVerification;
    };
    message: string;
}

export interface VerificationHistoryFilters {
    search?: string;
    certificate_id?: number;
    verified_by_name?: string;
    start_date?: string;
    end_date?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    page?: number;
    per_page?: number;
}

export interface VerificationHistoryResponse extends ApiResponse<CertificateVerification[]> {
    pagination: PaginationData;
}

// ========================================================================
// 📊 STATISTICS TYPES
// ========================================================================

export interface BlockchainStats {
    // Transaction stats
    total_transactions: number;
    pending_count: number;
    confirmed_count: number;
    failed_count: number;
    success_rate: number;
    average_processing_time?: number | null;
    
    // Certificate stats
    total_certificates: number;
    verified_certificates: number;
    pending_certificates: number;
}

// ========================================================================
// 🛠️ ADMIN BLOCKCHAIN SERVICE CLASS
// ========================================================================

class AdminBlockchainService {
    private baseURL = '';

    /**
     * Generic wrapper for authenticated API requests
     */
    private async request<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        
        const defaultOptions: RequestInit = {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': csrfToken || '',
                'X-Requested-With': 'XMLHttpRequest',
            },
            credentials: 'same-origin',
        };

        try {
            const response = await fetch(url, { ...defaultOptions, ...options });
            const contentType = response.headers.get('content-type');
            let data;
            
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                const text = await response.text();
                throw new Error('Unexpected response format from server');
            }

            if (!response.ok) {
                // Extract detailed error message
                let errorMessage = data.message || `Request failed with status ${response.status}`;
                
                if (data.errors) {
                    const errorMessages = Object.entries(data.errors)
                        .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
                        .join('; ');
                    errorMessage = errorMessages || errorMessage;
                }
                
                if (data.error) {
                    errorMessage = data.error;
                }
                
                if (data.debug && data.debug.file) {
                    console.error('Server error details:', data.debug);
                }
                
                throw new Error(errorMessage);
            }

            return data;
        } catch (error: any) {
            console.error('❌ REQUEST ERROR:', error);
            console.error('❌ URL:', url);
            console.error('❌ Options:', options);
            
            // If it's already an Error with a message, throw it as is
            if (error instanceof Error) {
                throw error;
            }
            
            // Otherwise, create a new error
            throw new Error(error.message || 'An unexpected error occurred');
        }
    }

    // ========================================================================
    // 📊 STATISTICS
    // ========================================================================

    /**
     * Get combined blockchain and certificate statistics
     */
    async getStats(): Promise<ApiResponse<BlockchainStats>> {
        return this.request<BlockchainStats>(`${this.baseURL}/blockchain/stats`);
    }

    // ========================================================================
    // 🔗 BLOCKCHAIN TRANSACTIONS
    // ========================================================================

    /**
     * Get paginated list of blockchain transactions with filters
     */
    async getTransactions(filters: TransactionFilters): Promise<TransactionsResponse> {
        const searchParams = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                searchParams.append(key, value.toString());
            }
        });

        const url = `${this.baseURL}/blockchain/transactions?${searchParams.toString()}`;
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
            },
        });
        
        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
            throw new Error(errorBody.message || errorBody.error || 'Failed to fetch transactions.');
        }

        return await response.json();
    }

    /**
     * Get a single transaction by ID
     */
    async getTransaction(id: number): Promise<ApiResponse<BlockchainTransaction>> {
        return this.request<BlockchainTransaction>(`${this.baseURL}/blockchain/transactions/${id}`);
    }

    /**
     * Retry a failed or pending transaction
     */
    async retryTransaction(id: number): Promise<ApiResponse<BlockchainTransaction>> {
        return this.request<BlockchainTransaction>(`${this.baseURL}/blockchain/transactions/${id}/retry`, {
            method: 'POST',
        });
    }

    /**
     * Delete a transaction record
     */
    async deleteTransaction(id: number): Promise<ApiResponse<null>> {
        return this.request<null>(`${this.baseURL}/blockchain/transactions/${id}`, {
            method: 'DELETE',
        });
    }

    // ========================================================================
    // 📜 CERTIFICATES
    // ========================================================================

    /**
     * Get paginated list of certificates with filters
     */
    async getCertificates(filters: CertificateFilters): Promise<CertificatesResponse> {
        const searchParams = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                searchParams.append(key, value.toString());
            }
        });

        const url = `${this.baseURL}/blockchain/certificates?${searchParams.toString()}`;
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
            },
        });
        
        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
            throw new Error(errorBody.message || errorBody.error || 'Failed to fetch certificates.');
        }

        return await response.json();
    }

    /**
     * Get a single certificate by ID
     */
    async getCertificate(id: number): Promise<ApiResponse<Certificate>> {
        return this.request<Certificate>(`${this.baseURL}/blockchain/certificates/${id}`);
    }

    /**
     * Create a new certificate
     */
    async createCertificate(certificateData: CertificateFormData): Promise<ApiResponse<Certificate>> {
        return this.request<Certificate>(`${this.baseURL}/blockchain/certificates`, {
            method: 'POST',
            body: JSON.stringify(certificateData),
        });
    }

    /**
     * Update an existing certificate
     */
    async updateCertificate(id: number, certificateData: Partial<CertificateFormData>): Promise<ApiResponse<Certificate>> {
        return this.request<Certificate>(`${this.baseURL}/blockchain/certificates/${id}`, {
            method: 'PUT',
            body: JSON.stringify(certificateData),
        });
    }

    /**
     * Delete a certificate
     */
    async deleteCertificate(id: number): Promise<ApiResponse<null>> {
        return this.request<null>(`${this.baseURL}/blockchain/certificates/${id}`, {
            method: 'DELETE',
        });
    }

    /**
     * Register a certificate on the blockchain
     */
    async registerCertificateOnBlockchain(id: number): Promise<ApiResponse<Certificate>> {
        return this.request<Certificate>(`${this.baseURL}/blockchain/certificates/${id}/register`, {
            method: 'POST',
        });
    }

    // ========================================================================
    // 🔍 CERTIFICATE VERIFICATION
    // ========================================================================

    /**
     * Verify a certificate by its certificate number
     */
    async verifyCertificate(certificateNumber: string, verifierName: string = 'Admin Lookup'): Promise<CertificateVerificationResponse> {
        const response = await this.request<any>(`${this.baseURL}/blockchain/verify`, {
            method: 'POST',
            body: JSON.stringify({
                certificate_number: certificateNumber,
                verified_by_name: verifierName,
            }),
        });
        
        return response as CertificateVerificationResponse;
    }

    /**
     * Get verification history
     */
    async getVerificationHistory(filters: VerificationHistoryFilters): Promise<VerificationHistoryResponse> {
        const searchParams = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                searchParams.append(key, value.toString());
            }
        });

        const url = `${this.baseURL}/blockchain/verifications?${searchParams.toString()}`;
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
            },
        });
        
        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
            throw new Error(errorBody.message || errorBody.error || 'Failed to fetch verification history.');
        }

        return await response.json();
    }

    /**
     * Delete a verification record
     */
    async deleteVerificationRecord(id: number): Promise<ApiResponse<null>> {
        return this.request<null>(`${this.baseURL}/blockchain/verifications/${id}`, {
            method: 'DELETE',
        });
    }
}

export const adminBlockchainService = new AdminBlockchainService();