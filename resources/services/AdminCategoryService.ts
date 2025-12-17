// ========================================================================
// 📚 ADMIN CATEGORY SERVICE - School Management System
// Contains Management functionality for Library Categories
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

// ⭐ CATEGORY MANAGEMENT INTERFACES
export interface Category {
    id: number;
    name: string;
    slug: string;
    description?: string;
    color: string;
    is_active: boolean;
    sort_order: number;
    books_count?: number;
    created_at: string;
    updated_at: string;
}

export interface CategoryFormData {
    name: string;
    slug?: string;
    description?: string;
    color?: string;
    is_active?: boolean;
    sort_order?: number;
}

export interface CategoryStats {
    total_categories: number;
    active_categories: number;
    categories_with_books: number;
    by_category: Array<{
        name: string;
        count: number;
        color: string;
    }>;
}

export interface CategoriesResponse extends ApiResponse<Category[]> {
    pagination?: PaginationData;
}

// ========================================================================
// 🛠️ ADMIN CATEGORY SERVICE CLASS
// ========================================================================

class AdminCategoryService {
    private baseURL = '';

    private async request<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        
        const defaultOptions: RequestInit = {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': csrfToken || '',
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
    // 📚 CATEGORY MANAGEMENT
    // ========================================================================

    /**
     * Get paginated list of categories
     */
    async getCategories(params: {
        page?: number;
        per_page?: number;
        search?: string;
        is_active?: boolean;
        sort_by?: string;
        sort_order?: 'asc' | 'desc';
    } = {}): Promise<CategoriesResponse> {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                searchParams.append(key, value.toString());
            }
        });
        return this.request<Category[]>(`/api/categories?${searchParams.toString()}`) as Promise<CategoriesResponse>;
    }

    /**
     * Get all active categories (for dropdowns)
     */
    async getActiveCategories(): Promise<ApiResponse<Category[]>> {
        return this.request<Category[]>(`/api/categories/active`);
    }

    /**
     * Get category statistics
     */
    async getCategoryStats(): Promise<ApiResponse<CategoryStats>> {
        return this.request<CategoryStats>(`/api/categories/stats`);
    }

    /**
     * Create new category
     */
    async createCategory(categoryData: CategoryFormData): Promise<ApiResponse<Category>> {
        return this.request<Category>(`/api/categories`, {
            method: 'POST',
            body: JSON.stringify(categoryData),
        });
    }

    /**
     * Update existing category
     */
    async updateCategory(id: number, categoryData: Partial<CategoryFormData>): Promise<ApiResponse<Category>> {
        return this.request<Category>(`/api/categories/${id}`, {
            method: 'PUT',
            body: JSON.stringify(categoryData),
        });
    }

    /**
     * Delete category
     */
    async deleteCategory(id: number): Promise<ApiResponse<null>> {
        return this.request<null>(`/api/categories/${id}`, {
            method: 'DELETE',
        });
    }
    
    /**
     * Get a single category by ID
     */
    async getCategory(id: number): Promise<ApiResponse<Category>> {
        return this.request<Category>(`/api/categories/${id}`);
    }
}

export const adminCategoryService = new AdminCategoryService();

