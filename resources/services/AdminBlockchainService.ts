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
export type TransactionType = 'certificate_creation' | 'certificate_update' | 'verification' | 'grade_creation' | 'grade_update' | 'attendance_creation' | 'attendance_update';

export interface AttendanceData {
    id: number;
    student_id: number;
    class_subject_id: number;
    attendance_date: string;
    status: 'Present' | 'Absent' | 'Late' | 'Excused';
    student?: {
        id: number;
        first_name: string;
        last_name: string;
        full_name?: string;
    };
    class_subject?: {
        id: number;
        subject?: {
            id: number;
            subject_code: string;
            subject_name: string;
        };
    };
}

export interface GradeData {
    id: number;
    student_id: number;
    class_subject_id: number;
    academic_year_id: number;
    semester_id: number;
    prelim_grade?: number | null;
    midterm_grade?: number | null;
    final_grade?: number | null;
    final_rating?: number | null;
    remarks?: string | null;
    student?: {
        id: number;
        first_name: string;
        last_name: string;
        full_name?: string;
    };
    class_subject?: {
        id: number;
        subject?: {
            id: number;
            subject_code: string;
            subject_name: string;
        };
    };
}

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
    attendance?: AttendanceData | null;
    grade?: GradeData | null;
    audit_logs?: AuditLogData[];
}

export interface AuditLogData {
    id: number;
    audit_type: string;
    auditable_type: string;
    auditable_id: number;
    old_values: Record<string, any> | null;
    new_values: Record<string, any> | null;
    changes: Record<string, { old: any; new: any }> | null;
    description: string;
    blockchain_hash: string | null;
    created_at: string;
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
    private baseURL = '/api';

    /**
     * Get CSRF token from various sources
     */
    private getCsrfToken(): string {
        // Try multiple sources for CSRF token
        let csrfToken: string | null = null;
        
        // 1. Try meta tag first
        csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || null;
        
        // 2. Try Inertia page props
        if (!csrfToken && typeof window !== 'undefined') {
            try {
                const inertiaData = (window as any).__INERTIA_DATA__;
                if (inertiaData?.page?.props?.csrf_token) {
                    csrfToken = inertiaData.page.props.csrf_token;
                } else if ((window as any).Inertia?.page?.props?.csrf_token) {
                    csrfToken = (window as any).Inertia.page.props.csrf_token;
                }
            } catch (e) {
                console.warn('Could not retrieve CSRF token from Inertia props:', e);
            }
        }
        
        // 3. Try Laravel's default token name
        if (!csrfToken) {
            const tokenInput = document.querySelector('input[name="_token"]') as HTMLInputElement;
            if (tokenInput) {
                csrfToken = tokenInput.value;
            }
        }
        
        if (!csrfToken) {
            console.error('CSRF token not found. Please refresh the page.');
            throw new Error('CSRF token not found. Please refresh the page.');
        }
        
        return csrfToken;
    }

    /**
     * Get fresh CSRF token from server
     */
    private async getFreshCsrfToken(): Promise<string> {
        try {
            const absoluteUrl = window.location.origin + '/api/csrf-token';
            console.log('Fetching fresh CSRF token from /api/csrf-token...');
            const response = await fetch(absoluteUrl, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.csrf_token) {
                    console.log('Successfully retrieved fresh CSRF token');
                    // Update the meta tag with the new token
                    const metaTag = document.querySelector('meta[name="csrf-token"]');
                    if (metaTag) {
                        metaTag.setAttribute('content', data.csrf_token);
                        console.log('Updated meta tag with new CSRF token');
                    }
                    return data.csrf_token;
                }
                console.error('Invalid CSRF token response:', data);
            } else {
                console.error(`Failed to fetch CSRF token: ${response.status} ${response.statusText}`);
            }
        } catch (e) {
            console.warn('Could not fetch fresh CSRF token from server:', e);
        }
        
        // Fallback to getting token from page
        return this.getCsrfToken();
    }

    /**
     * Generic wrapper for authenticated API requests
     */
    private async request<T>(url: string, options: RequestInit = {}, retryOn419: boolean = true): Promise<ApiResponse<T>> {
        const csrfToken = this.getCsrfToken();
        
        // Ensure URL is absolute - always use full URL to avoid redirects
        let absoluteUrl = url;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            // Use window.location.origin to create absolute URL
            absoluteUrl = window.location.origin + (url.startsWith('/') ? url : '/' + url);
        }
        
        const defaultOptions: RequestInit = {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': csrfToken,
                'X-Requested-With': 'XMLHttpRequest',
            },
            credentials: 'include', // Changed from 'same-origin' to 'include' to ensure cookies are sent
        };

        try {
            // Merge options carefully - ensure headers are merged correctly
            const mergedOptions: RequestInit = {
                ...defaultOptions,
                ...options,
                headers: {
                    ...defaultOptions.headers,
                    ...(options.headers || {}),
                }
            };
            
            const response = await fetch(absoluteUrl, mergedOptions);
            const contentType = response.headers.get('content-type');
            
            // Handle 419 CSRF token mismatch BEFORE reading response body
            // This allows us to retry with a fresh token
            if (response.status === 419) {
                console.error('CSRF token mismatch (419). Current token:', csrfToken ? csrfToken.substring(0, 10) + '...' : 'missing');
                
                if (retryOn419) {
                    // Try to get a fresh token from the server and retry once
                    try {
                        console.log('Attempting to refresh CSRF token and retry request...');
                        const freshToken = await this.getFreshCsrfToken();
                        if (freshToken) {
                            console.log('Token refreshed, retrying request with new token...');
                            // Retry with fresh token
                            const retryOptions = {
                                ...options,
                                headers: {
                                    ...defaultOptions.headers,
                                    ...options.headers,
                                    'X-CSRF-TOKEN': freshToken,
                                }
                            };
                            return this.request<T>(url, retryOptions, false); // Don't retry again
                        } else {
                            console.warn('Could not get a fresh token, refresh failed');
                        }
                    } catch (e) {
                        console.error('Could not refresh CSRF token:', e);
                    }
                }
                
                // If we still get 419 or retry failed, read response and show error
                const text = await response.text();
                console.error('CSRF token mismatch (419). Response:', text.substring(0, 200));
                const errorMsg = 'Your session has expired. Please refresh the page and try again.';
                throw new Error(errorMsg);
            }
            
            let data;
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                // For non-JSON responses, try to get text and provide better error
                const text = await response.text();
                if (response.status >= 400) {
                    throw new Error(`Server error (${response.status}): ${text.substring(0, 200)}`);
                }
                throw new Error('Unexpected response format from server');
            }

            if (!response.ok) {
                // Handle 401 Unauthorized - redirect to login
                if (response.status === 401) {
                    console.warn('Unauthorized request, redirecting to login...');
                    window.location.href = '/login';
                    throw new Error('Unauthorized. Please log in again.');
                }
                
                // Handle 405 Method Not Allowed - usually means wrong URL or route
                if (response.status === 405) {
                    console.error('Method Not Allowed (405). URL:', url, 'Method:', options.method || 'GET');
                    throw new Error(`Invalid request: The URL '${url}' does not support ${options.method || 'GET'} method. Please check the route configuration.`);
                }
                
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