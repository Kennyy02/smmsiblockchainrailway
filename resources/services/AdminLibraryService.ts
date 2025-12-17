// ========================================================================
// 📚 ADMIN LIBRARY SERVICE - School Management System
// Contains Management functionality for Library Books
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

// ⭐ BOOK MANAGEMENT INTERFACES
export interface Category {
    id: number;
    name: string;
    slug: string;
    color?: string;
}

export interface Book {
    id: number;
    isbn?: string;
    title: string;
    author?: string;
    publisher?: string;
    publication_year?: number;
    description?: string;
    category_id: number;
    category?: Category;
    total_copies: number;
    available_copies: number;
    location?: string;
    status: 'available' | 'borrowed' | 'maintenance' | 'lost';
    created_at: string;
    updated_at: string;
}

export interface BookFormData {
    isbn?: string;
    title: string;
    author?: string;
    publisher?: string;
    publication_year?: number;
    description?: string;
    category_id: number;
    total_copies: number;
    available_copies: number;
    location?: string;
    status: 'available' | 'borrowed' | 'maintenance' | 'lost';
}

export interface LibraryStats {
    total_books: number;
    available_books: number;
    borrowed_books?: number;
    lost_books?: number;
    total_copies: number;
    available_copies: number;
    borrowed_copies: number;
    by_category: Record<string, number>;
}

export interface BooksResponse extends ApiResponse<Book[]> {
    pagination?: PaginationData;
}

// ========================================================================
// 🛠️ ADMIN LIBRARY SERVICE CLASS
// ========================================================================

class AdminLibraryService {
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
    // 📚 BOOK MANAGEMENT
    // ========================================================================

    /**
     * Get paginated list of books
     */
    async getBooks(params: {
        page?: number;
        per_page?: number;
        search?: string;
        category?: string;
        sort_by?: string;
        sort_order?: 'asc' | 'desc';
    } = {}): Promise<BooksResponse> {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                searchParams.append(key, value.toString());
            }
        });
        return this.request<Book[]>(`/api/library?${searchParams.toString()}`) as Promise<BooksResponse>;
    }

    /**
     * Get library statistics
     */
    async getLibraryStats(): Promise<ApiResponse<LibraryStats>> {
        return this.request<LibraryStats>(`/api/library/stats`);
    }

    /**
     * Create new book
     */
    async createBook(bookData: BookFormData): Promise<ApiResponse<Book>> {
        return this.request<Book>(`/api/library`, {
            method: 'POST',
            body: JSON.stringify(bookData),
        });
    }

    /**
     * Update existing book
     */
    async updateBook(id: number, bookData: Partial<BookFormData>): Promise<ApiResponse<Book>> {
        return this.request<Book>(`/api/library/${id}`, {
            method: 'PUT',
            body: JSON.stringify(bookData),
        });
    }

    /**
     * Delete book
     */
    async deleteBook(id: number): Promise<ApiResponse<null>> {
        return this.request<null>(`/api/library/${id}`, {
            method: 'DELETE',
        });
    }
    
    /**
     * Get a single book by ID
     */
    async getBook(id: number): Promise<ApiResponse<Book>> {
        return this.request<Book>(`/api/library/${id}`);
    }
}

export const adminLibraryService = new AdminLibraryService();

