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
    
    // Helper to create FormData from upload data
    private createFormData(data: CourseMaterialUploadData): FormData {
        const formData = new FormData();
        formData.append('subject_id', data.subject_id.toString());
        formData.append('title', data.title);
        if (data.description) {
            formData.append('description', data.description);
        }
        formData.append('file', data.file);
        
        // Debug: Verify file is in FormData
        if (formData.has('file')) {
            console.log('✅ File added to FormData:', data.file.name);
        } else {
            console.error('❌ File NOT in FormData!');
        }
        
        return formData;
    }

    // FormData Request Handler (For file uploads) with CSRF token refresh on 419
    private async formDataRequest<T>(
        url: string, 
        formData: FormData | CourseMaterialUploadData, 
        retry: boolean = true
    ): Promise<ApiResponse<T>> {
        // If formData is actually upload data, convert it to FormData
        const isUploadData = formData && typeof formData === 'object' && 'file' in formData && formData.file instanceof File;
        const uploadData = isUploadData ? (formData as CourseMaterialUploadData) : null;
        let requestFormData = isUploadData && uploadData ? this.createFormData(uploadData) : formData as FormData;
        
        let csrfToken = this.getCsrfToken();
        
        const makeRequest = (formDataToSend: FormData, token: string) => {
            // Ensure URL is absolute - use full URL to avoid redirects
            let absoluteUrl = url;
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                absoluteUrl = window.location.origin + (url.startsWith('/') ? url : '/' + url);
            }
            
            // Debug: Verify FormData contents before sending
            console.log('📤 Sending request with FormData:', {
                hasFile: formDataToSend.has('file'),
                hasSubjectId: formDataToSend.has('subject_id'),
                hasTitle: formDataToSend.has('title'),
                url: absoluteUrl,
            });
            
            // Get all FormData entries for debugging (note: this consumes FormData, so we recreate it)
            if (uploadData) {
                // We can safely check uploadData since we have it
                console.log('📋 FormData contents:', {
                    subject_id: uploadData.subject_id,
                    title: uploadData.title,
                    description: uploadData.description,
                    file_name: uploadData.file.name,
                    file_size: uploadData.file.size,
                    file_type: uploadData.file.type,
                });
            }
            
            // IMPORTANT: Do NOT set Content-Type header - browser will set it automatically with boundary
            // When using FormData, the browser automatically sets Content-Type to multipart/form-data with boundary
            // Manually setting it would break the file upload
            
            // Verify file is still in FormData right before sending
            if (!formDataToSend.has('file')) {
                console.error('❌ CRITICAL: File missing from FormData right before sending!');
                if (uploadData && uploadData.file instanceof File) {
                    // Recreate FormData if file is missing
                    console.log('🔄 Recreating FormData...');
                    formDataToSend = this.createFormData(uploadData);
                }
            }
            
            const fetchOptions: RequestInit = {
                method: 'POST',
                body: formDataToSend,
                credentials: 'same-origin',
            };
            
            // Only set custom headers (NOT Content-Type - browser handles that)
            // Note: When using FormData, fetch() will automatically set Content-Type with boundary
            const headers: HeadersInit = {
                'X-CSRF-TOKEN': token,
                'X-Requested-With': 'XMLHttpRequest',
            };
            
            fetchOptions.headers = headers;
            
            // Log the actual request details
            console.log('🚀 Making fetch request:', {
                url: absoluteUrl,
                method: 'POST',
                hasBody: !!fetchOptions.body,
                headers: Object.keys(headers),
                credentials: fetchOptions.credentials,
            });
            
            return fetch(absoluteUrl, fetchOptions);
        };

        try {
            const response = await makeRequest(requestFormData, csrfToken);
            
            const contentType = response.headers.get('content-type');
            
            // Handle 419 CSRF token mismatch - try refreshing token and retry once
            if (response.status === 419 && retry) {
                console.log('🔄 CSRF token expired, fetching fresh token and retrying...');
                try {
                    csrfToken = await this.fetchFreshCsrfToken();
                    // Recreate FormData for retry (FormData can only be read once)
                    if (uploadData) {
                        requestFormData = this.createFormData(uploadData);
                    }
                    
                    const retryResponse = await makeRequest(requestFormData, csrfToken);
                    
                    if (!retryResponse.headers.get('content-type')?.includes('application/json')) {
                        const responseText = await retryResponse.text();
                        if (retryResponse.status === 419 || retryResponse.status === 401 || retryResponse.status === 403) {
                            throw new Error(`Authentication/CSRF Error: Server returned status ${retryResponse.status}. Your session may have expired. Please refresh the page.`);
                        }
                        throw new Error(`Unexpected response format: expected JSON. Status: ${retryResponse.status}`);
                    }
                    
                    const retryData = await retryResponse.json();
                    
                    if (!retryResponse.ok) {
                        // Log backend debug info if available (retry)
                        if (retryData.debug) {
                            console.error('🔍 Backend Debug Info (retry):', {
                                content_type: retryData.debug.content_type,
                                has_file: retryData.debug.has_file,
                                all_files_count: retryData.debug.all_files_count,
                                files_direct_keys: retryData.debug.files_direct_keys,
                                upload_error: retryData.debug.upload_error,
                            });
                        }
                        
                        // Enhanced error handling for validation errors on retry
                        let errorMessage = retryData.message || `File upload failed with status ${retryResponse.status}`;
                        
                        if (retryData.errors) {
                            const errorDetails = Object.entries(retryData.errors).map(([field, msgs]) => {
                                const messages = Array.isArray(msgs) ? msgs : [msgs];
                                return `${field}: ${messages.join(', ')}`;
                            }).join('; ');
                            
                            errorMessage = errorDetails || errorMessage;
                            console.error('❌ Validation errors (retry):', retryData.errors);
                        }
                        
                        throw new Error(errorMessage);
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
                // Log backend debug info if available
                if (data.debug) {
                    console.error('🔍 Backend Debug Info:', {
                        content_type: data.debug.content_type,
                        has_file: data.debug.has_file,
                        all_files_count: data.debug.all_files_count,
                        files_direct_keys: data.debug.files_direct_keys,
                        upload_error: data.debug.upload_error,
                    });
                    
                    // Provide helpful error message for PHP upload limits
                    if (data.debug.upload_error && data.debug.upload_error.includes('upload_max_filesize')) {
                        const fileSizeMB = uploadData ? (uploadData.file.size / 1024 / 1024).toFixed(2) : 'unknown';
                        throw new Error(`File size (${fileSizeMB} MB) exceeds the server's PHP upload_max_filesize limit. Please reduce the file size or contact the administrator to increase the PHP upload limits.`);
                    }
                }
                
                // Enhanced error handling for validation errors
                let errorMessage = data.message || `File upload failed with status ${response.status}`;
                
                if (data.errors) {
                    const errorDetails = Object.entries(data.errors).map(([field, msgs]) => {
                        const messages = Array.isArray(msgs) ? msgs : [msgs];
                        return `${field}: ${messages.join(', ')}`;
                    }).join('; ');
                    
                    errorMessage = errorDetails || errorMessage;
                    
                    // Log detailed errors for debugging
                    console.error('❌ Validation errors:', data.errors);
                }
                
                throw new Error(errorMessage);
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
        // Validate file before upload
        if (!data.file) {
            throw new Error('No file provided for upload');
        }

        // Check file size (max 10MB = 10240 KB)
        const maxSizeBytes = 10 * 1024 * 1024; // 10MB in bytes
        if (data.file.size > maxSizeBytes) {
            throw new Error(`File size (${(data.file.size / 1024 / 1024).toFixed(2)} MB) exceeds the maximum allowed size of 10 MB`);
        }

        // Warn if file is larger than 2MB (common PHP default limit)
        const phpDefaultLimit = 2 * 1024 * 1024; // 2MB
        if (data.file.size > phpDefaultLimit) {
            console.warn(`⚠️ File size (${(data.file.size / 1024 / 1024).toFixed(2)} MB) may exceed server PHP upload_max_filesize limit. If upload fails, contact administrator to increase PHP limits.`);
        }

        // Fetch fresh CSRF token before upload to prevent 419 errors
        try {
            await this.fetchFreshCsrfToken();
        } catch (error) {
            console.warn('⚠️ Could not fetch fresh CSRF token, using existing token:', error);
        }
        
        // Log file info for debugging (without sensitive data)
        console.log('📤 Uploading file:', {
            name: data.file.name,
            size: `${(data.file.size / 1024).toFixed(2)} KB`,
            type: data.file.type
        });
        
        // Pass the data object directly so FormData can be recreated on retry if needed
        return this.formDataRequest<CourseMaterial>(`${this.baseURL}/course-materials`, data);
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
