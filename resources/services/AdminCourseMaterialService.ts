// ========================================================================
// 🔐 ADMIN COURSE MATERIAL SERVICE
// Handles API calls for Course Material (File) management
// Now subject-based instead of class-subject-based
// ========================================================================

// Reusing general interfaces for consistency
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

// Subject interface for dropdowns
export interface Subject {
    id: number;
    subject_code: string;
    subject_name: string;
    description?: string;
}

// 📋 INTERFACE DEFINITIONS
export interface CourseMaterial {
    id: number;
    subject_id: number;
    title: string;
    description: string | null;
    file_path: string;
    file_mime_type?: string;
    file_size?: number;
    uploaded_by?: number;
    created_at: string;

    // Computed properties (from CourseMaterial.php accessors)
    uploaded_by_name?: string;
    subject_name?: string;
    subject_code?: string;
    file_type?: string;
    file_icon?: string;

    // Relationships
    subject?: Subject;
    uploader?: {
        id: number;
        name: string;
    };
}

// Used for metadata update (PUT)
export interface CourseMaterialUpdateData {
    subject_id: number;
    title: string;
    description?: string | null;
}

// Used for file upload (POST/FormData)
export interface CourseMaterialUploadData extends CourseMaterialUpdateData {
    file: File;
}

export interface CourseMaterialsResponse extends ApiResponse<CourseMaterial[]> {
    pagination?: PaginationData;
}


// 🛠️ ADMIN COURSE MATERIAL SERVICE CLASS

class AdminCourseMaterialService {
    private baseURL = '/api';

    // Helper method to get CSRF token from meta tag
    private getCsrfToken(): string {
        const metaTag = document.querySelector('meta[name="csrf-token"]');
        return metaTag?.getAttribute('content') || '';
    }

    // Helper method to update CSRF token in meta tag
    private updateCsrfToken(token: string): void {
        const metaTag = document.querySelector('meta[name="csrf-token"]');
        if (metaTag) {
            metaTag.setAttribute('content', token);
        }
    }

    // Fetch fresh CSRF token from API
    private async fetchFreshCsrfToken(): Promise<string> {
        try {
            const response = await fetch(`${this.baseURL}/csrf-token`, {
                method: 'GET',
                credentials: 'same-origin',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch CSRF token: ${response.status}`);
            }

            const data = await response.json();
            if (data.success && data.csrf_token) {
                this.updateCsrfToken(data.csrf_token);
                return data.csrf_token;
            }

            throw new Error('Invalid CSRF token response');
        } catch (error) {
            console.error('❌ CSRF TOKEN FETCH ERROR:', error);
            throw error;
        }
    }

    // Standard JSON Request Handler
    private async request<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
        const csrfToken = this.getCsrfToken();
        
        const defaultOptions: RequestInit = {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': csrfToken,
                'X-Requested-With': 'XMLHttpRequest',
                ...options.headers,
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
                throw new Error(`Unexpected non-JSON response from server: Status ${response.status}`);
            }

            if (!response.ok) {
                const errorMessages = data.errors 
                    ? Object.entries(data.errors).map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`).join('; ')
                    : data.message;
                throw new Error(errorMessages || `Request failed with status ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('❌ REQUEST ERROR:', error);
            throw error;
        }
    }
    
    // FormData Request Handler (For file uploads) with CSRF token refresh on 419
    private async formDataRequest<T>(url: string, formData: FormData, retry: boolean = true): Promise<ApiResponse<T>> {
        let csrfToken = this.getCsrfToken();
        
        const options: RequestInit = {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRF-TOKEN': csrfToken,
                'X-Requested-With': 'XMLHttpRequest',
            },
            credentials: 'same-origin',
        };

        try {
            const response = await fetch(url, options);
            
            const contentType = response.headers.get('content-type');
            
            // Handle 419 CSRF token mismatch - try refreshing token and retry once
            if (response.status === 419 && retry) {
                console.log('🔄 CSRF token expired, fetching fresh token and retrying...');
                try {
                    csrfToken = await this.fetchFreshCsrfToken();
                    // Retry with fresh token
                    options.headers = {
                        'X-CSRF-TOKEN': csrfToken,
                        'X-Requested-With': 'XMLHttpRequest',
                    };
                    const retryResponse = await fetch(url, options);
                    
                    if (!retryResponse.headers.get('content-type')?.includes('application/json')) {
                        const responseText = await retryResponse.text();
                        if (retryResponse.status === 419 || retryResponse.status === 401 || retryResponse.status === 403) {
                            throw new Error(`Authentication/CSRF Error: Server returned status ${retryResponse.status}. Your session may have expired. Please refresh the page.`);
                        }
                        throw new Error(`Unexpected response format: expected JSON. Status: ${retryResponse.status}`);
                    }
                    
                    const retryData = await retryResponse.json();
                    
                    if (!retryResponse.ok) {
                        const errorMessages = retryData.errors 
                            ? Object.entries(retryData.errors).map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`).join('; ')
                            : retryData.message;
                        throw new Error(errorMessages || `File upload failed with status ${retryResponse.status}`);
                    }
                    
                    return retryData;
                } catch (refreshError) {
                    throw new Error(`Session expired. Please refresh the page and try again.`);
                }
            }
            
            if (!contentType || !contentType.includes('application/json')) {
                const responseText = await response.text();
                
                if (response.status === 419 || response.status === 401 || response.status === 403) {
                    throw new Error(`Authentication/CSRF Error: Server returned status ${response.status}. Your session may have expired. Please refresh the page.`);
                }
                
                if (responseText.startsWith('<!DOCTYPE html>')) {
                    throw new Error(`Server Error: Unexpected HTML response. Check backend logs. Status: ${response.status}`);
                }
                
                throw new Error(`Unexpected response format: expected JSON. Status: ${response.status}`);
            }
            
            const data = await response.json(); 
            
            if (!response.ok) {
                const errorMessages = data.errors 
                    ? Object.entries(data.errors).map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`).join('; ')
                    : data.message;
                throw new Error(errorMessages || `File upload failed with status ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error('❌ FILE UPLOAD ERROR:', error);
            throw error;
        }
    }


    // 📚 COURSE MATERIAL ENDPOINTS
    
    /**
     * Get list of course materials
     */
    async getCourseMaterials(params: { subject_id?: number; search?: string } = {}): Promise<ApiResponse<CourseMaterial[]>> {
        const searchParams = new URLSearchParams();
        if (params.subject_id) {
            searchParams.append('subject_id', params.subject_id.toString());
        }
        if (params.search) {
            searchParams.append('search', params.search);
        }
        return this.request<CourseMaterial[]>(`${this.baseURL}/course-materials?${searchParams.toString()}`);
    }
    
    /**
     * Upload a new course material (Uses FormData for file transfer)
     */
    async uploadMaterial(data: CourseMaterialUploadData): Promise<ApiResponse<CourseMaterial>> {
        // Fetch fresh CSRF token before upload to prevent 419 errors
        try {
            await this.fetchFreshCsrfToken();
        } catch (error) {
            console.warn('⚠️ Could not fetch fresh CSRF token, using existing token:', error);
        }

        const formData = new FormData();
        formData.append('subject_id', data.subject_id.toString());
        formData.append('title', data.title);
        if (data.description) {
            formData.append('description', data.description);
        }
        formData.append('file', data.file);
        
        return this.formDataRequest<CourseMaterial>(`${this.baseURL}/course-materials`, formData);
    }

    /**
     * Update material metadata (title, description, subject_id)
     */
    async updateMaterial(id: number, data: CourseMaterialUpdateData): Promise<ApiResponse<CourseMaterial>> {
        return this.request<CourseMaterial>(`${this.baseURL}/course-materials/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    /**
     * Download the specified course material file
     */
    async downloadMaterial(id: number, filename: string): Promise<void> {
        const url = `${this.baseURL}/course-materials/${id}/download`; 
        
        try {
            const response = await fetch(url, {
                method: 'GET',
                credentials: 'same-origin',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                }
            });

            if (!response.ok) {
                const contentType = response.headers.get('content-type');
                if (contentType?.includes('application/json')) {
                     const errorData = await response.json();
                     throw new Error(`Download failed: ${errorData.message || 'Server error'}`);
                }
                
                throw new Error(`Download failed with status ${response.status}.`);
            }

            const blob = await response.blob();
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(link.href);
            
        } catch (error) {
            console.error('❌ DOWNLOAD ERROR:', error);
            throw error;
        }
    }

    /**
     * Delete material (removes record and file)
     */
    async deleteMaterial(id: number): Promise<ApiResponse<null>> {
        return this.request<null>(`${this.baseURL}/course-materials/${id}`, {
            method: 'DELETE',
        });
    }
    
    /**
     * Fetch all Subjects for dropdowns
     */
    async getSubjects(): Promise<ApiResponse<Subject[]>> {
        return this.request<Subject[]>(`${this.baseURL}/course-materials/subjects`);
    }
}

export const adminCourseMaterialService = new AdminCourseMaterialService();
