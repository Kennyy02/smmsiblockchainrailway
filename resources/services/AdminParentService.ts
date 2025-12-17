// ========================================================================
// 🔐 ADMIN PARENT SERVICE - School Management System
// Contains Parent/Guardian Management functionality
// ========================================================================

// ========================================================================
// 📋 INTERFACE DEFINITIONS
// ========================================================================

// Interfaces common to all services
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

// ⭐ PARENT MANAGEMENT INTERFACES
export interface ChildInfo {
    id: number;
    full_name: string;
    year_level: number;
    program?: string;
}

export interface LinkedStudent {
    id: number;
    first_name: string;
    last_name: string;
    full_name: string;
    year_level: number;
    program?: string;
    pivot?: { relationship: string };
}

export interface Parent {
    id: number;
    user_id: number;
    guardian_id?: string; 
    first_name: string;
    last_name: string;
    middle_name?: string;
    email: string;
    phone: string;
    address?: string;
    full_name: string; // Computed by PHP model
    students_count: number; // Count is returned by ParentController.php index
    relationship_to_student?: string; // Used by frontend, inferred/managed internally
    children?: ChildInfo[]; // Children/students linked to this parent
    students?: LinkedStudent[]; // Students linked with pivot data
    created_at: string;
}

export interface StudentSelection {
    student_id: number;
    relationship: string; // Father, Mother, Guardian, etc.
}

export interface ParentFormData {
    // PHP Controller validation checks for user_id existence on store.
    // In a full implementation, the backend would create the user and get the ID.
    // For this form payload, we map fields directly to the ParentModel fields.
    user_id?: number; 
    first_name: string;
    last_name: string;
    middle_name?: string;
    email: string;
    phone: string;
    address?: string;
    // Frontend uses these, but PHP Controller does not validate/store them directly on ParentModel.
    // Assuming backend handles User creation (password) and relationship mapping.
    password?: string;
    password_confirmation?: string;
    // Students to link with this parent
    students?: StudentSelection[];
}

export interface ParentStats {
    total_parents: number;
    verified_parents: number; 
    by_relationship: { relationship?: string; level?: string; count: number }[];
    by_education_level?: { level: string; count: number }[];
}

export interface ParentsResponse extends ApiResponse<Parent[]> {
    pagination?: PaginationData;
}


// ========================================================================
// 🛠️ ADMIN PARENT SERVICE CLASS
// ========================================================================

class AdminParentService {
    private baseURL = '';

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
                if (data.errors) {
                    const errorMessages = Object.entries(data.errors)
                        .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
                        .join('; ');
                    throw new Error(errorMessages || data.message || `Request failed with status ${response.status}`);
                }
                throw new Error(data.message || `Request failed with status ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('❌ REQUEST ERROR:', error);
            throw error;
        }
    }

    // ========================================================================
    // 👪 PARENT MANAGEMENT
    // ========================================================================

    /**
     * Get paginated list of parents. (Implemented in ParentController.php)
     */
    async getParents(params: {
        page?: number;
        per_page?: number;
        search?: string;
        relationship?: string; 
        education_level?: string; // Filter by children's education level (College, Senior High, etc.)
    } = {}): Promise<ParentsResponse> {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                searchParams.append(key, value.toString());
            }
        });
        return this.request<Parent[]>(`${this.baseURL}/parents?${searchParams.toString()}`) as Promise<ParentsResponse>;
    }

    /**
     * Get parent statistics. (Inferred)
     */
    async getParentStats(): Promise<ApiResponse<ParentStats>> {
        // Assuming API route exists based on Students/Teachers patterns
        return this.request<ParentStats>(`${this.baseURL}/parents/stats`);
    }

    /**
     * Create new parent. (Implemented in ParentController.php)
     */
    async createParent(parentData: ParentFormData): Promise<ApiResponse<Parent>> {
        return this.request<Parent>(`${this.baseURL}/parents`, {
            method: 'POST',
            body: JSON.stringify(parentData),
        });
    }

    /**
     * Update existing parent. (Inferred)
     */
    async updateParent(id: number, parentData: Partial<ParentFormData>): Promise<ApiResponse<Parent>> {
        return this.request<Parent>(`${this.baseURL}/parents/${id}`, {
            method: 'PUT',
            body: JSON.stringify(parentData),
        });
    }

    /**
     * Delete parent. (Inferred)
     */
    async deleteParent(id: number): Promise<ApiResponse<null>> {
        // Inferred implementation based on other CRUD controllers
        return this.request<null>(`${this.baseURL}/parents/${id}`, {
            method: 'DELETE',
        });
    }
    
    /**
     * Get a single parent by ID. (Inferred)
     */
    async getParent(id: number): Promise<ApiResponse<Parent>> {
        return this.request<Parent>(`${this.baseURL}/parents/${id}`);
    }

    /**
     * Link student to a parent. (Inferred from ParentController.php store logic)
     */
    async linkStudent(parentId: number, studentId: number): Promise<ApiResponse<any>> {
        return this.request<any>(`${this.baseURL}/parents/${parentId}/link-student`, {
            method: 'POST',
            body: JSON.stringify({ student_id: studentId }),
        });
    }

    /**
     * Unlink student from a parent. (Inferred)
     */
    async unlinkStudent(parentId: number, studentId: number): Promise<ApiResponse<any>> {
        return this.request<any>(`${this.baseURL}/parents/${parentId}/unlink-student`, {
            method: 'DELETE',
            body: JSON.stringify({ student_id: studentId }),
        });
    }

    /**
     * Export parents/guardians to CSV - Organized format with all information
     */
    exportParentsToCSV(parents: Parent[], filename: string = 'parents_report.csv'): void {
        // Define CSV headers - organized columns
        const headers = [
            'No.',
            'Guardian ID',
            'Last Name',
            'First Name',
            'Middle Name',
            'Email',
            'Phone',
            'Address',
            'Relationship',
            'Number of Children',
            'Children Names',
            'Children Programs',
            'Education Levels'
        ];

        // Get education level from year level
        const getEducationLevel = (yearLevel: number): string => {
            if (yearLevel >= 13) return 'College';
            if (yearLevel >= 11) return 'Senior High';
            if (yearLevel >= 7) return 'Junior High';
            return 'Elementary';
        };

        // Convert parents to CSV rows with all info
        const rows = parents.map((parent, index) => {
            const children = parent.students || [];
            const childrenNames = children.map(c => `${c.first_name} ${c.last_name}`).join('; ');
            const childrenPrograms = children.map(c => c.program || 'N/A').join('; ');
            const educationLevels = children.map(c => getEducationLevel(c.year_level)).join('; ');
            
            return [
                index + 1,
                parent.guardian_id || '',
                parent.last_name,
                parent.first_name,
                parent.middle_name || '',
                parent.email,
                parent.phone || '',
                parent.address || '',
                parent.relationship || 'Parent',
                children.length,
                childrenNames,
                childrenPrograms,
                educationLevels
            ];
        });

        // Combine headers and rows
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        // Add BOM for Excel compatibility
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}

export const adminParentService = new AdminParentService();