<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Inertia\Inertia;

class CategoryController extends Controller
{
    /**
     * Display a listing of categories
     */
    public function index(Request $request)
    {
        try {
            $query = Category::withCount('books');
            
            // Apply search filter
            if ($search = $request->input('search')) {
                $query->search($search);
            }
            
            // Filter active/inactive
            if ($request->has('is_active')) {
                $query->where('is_active', $request->input('is_active'));
            }
            
            // Apply sorting
            $sortBy = $request->input('sort_by', 'sort_order');
            $sortOrder = $request->input('sort_order', 'asc');
            
            if ($sortBy === 'sort_order') {
                $query->ordered();
            } else {
                $query->orderBy($sortBy, $sortOrder);
            }
            
            // Check if request expects JSON (API call)
            if ($request->expectsJson()) {
                if ($request->input('paginate', true)) {
                    $perPage = $request->input('per_page', 15);
                    $categories = $query->paginate($perPage);
                    
                    return response()->json([
                        'success' => true,
                        'data' => $categories->items(),
                        'pagination' => [
                            'current_page' => $categories->currentPage(),
                            'last_page' => $categories->lastPage(),
                            'per_page' => $categories->perPage(),
                            'total' => $categories->total()
                        ]
                    ]);
                } else {
                    $categories = $query->get();
                    return response()->json([
                        'success' => true,
                        'data' => $categories
                    ]);
                }
            }
            
            // Return Inertia view
            $perPage = $request->input('per_page', 15);
            $categories = $query->paginate($perPage);
            
            return Inertia::render('Admin/Categories', [
                'categories' => $categories,
                'filters' => $request->only(['search', 'is_active', 'sort_by', 'sort_order'])
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching categories: ' . $e->getMessage());
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to retrieve categories',
                    'error' => $e->getMessage()
                ], 500);
            }
            
            return back()->with('error', 'Failed to retrieve categories');
        }
    }

    /**
     * Get all active categories (for dropdowns, etc.)
     */
    public function getActive(Request $request)
    {
        try {
            $categories = Category::active()->ordered()->get();
            
            return response()->json([
                'success' => true,
                'data' => $categories
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching active categories: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve active categories',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get category statistics
     */
    public function getStats(Request $request)
    {
        try {
            $totalCategories = Category::count();
            $activeCategories = Category::active()->count();
            $categoriesWithBooks = Category::has('books')->count();
            
            $byCategory = Category::withCount('books')
                ->having('books_count', '>', 0)
                ->orderBy('books_count', 'desc')
                ->get()
                ->map(function($category) {
                    return [
                        'name' => $category->name,
                        'count' => $category->books_count,
                        'color' => $category->color,
                    ];
                });
            
            return response()->json([
                'success' => true,
                'data' => [
                    'total_categories' => $totalCategories,
                    'active_categories' => $activeCategories,
                    'categories_with_books' => $categoriesWithBooks,
                    'by_category' => $byCategory,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching category stats: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve category stats',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created category
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255|unique:categories',
                'slug' => 'nullable|string|max:255|unique:categories',
                'description' => 'nullable|string',
                'color' => 'nullable|string|max:7|regex:/^#[0-9A-Fa-f]{6}$/',
                'is_active' => 'boolean',
                'sort_order' => 'nullable|integer|min:0',
            ]);

            if ($validator->fails()) {
                if ($request->expectsJson()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Validation failed',
                        'errors' => $validator->errors()
                    ], 422);
                }
                
                return back()->withErrors($validator)->withInput();
            }

            $data = $validator->validated();
            
            // Generate slug if not provided
            if (empty($data['slug'])) {
                $data['slug'] = Str::slug($data['name']);
            }
            
            // Set defaults
            $data['is_active'] = $data['is_active'] ?? true;
            $data['sort_order'] = $data['sort_order'] ?? 0;
            $data['color'] = $data['color'] ?? '#6366f1';

            $category = Category::create($data);
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'data' => $category,
                    'message' => 'Category created successfully'
                ], 201);
            }
            
            return redirect()->route('admin.categories')
                ->with('success', 'Category created successfully');
        } catch (\Exception $e) {
            Log::error('Error creating category: ' . $e->getMessage());
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to create category',
                    'error' => $e->getMessage()
                ], 500);
            }
            
            return back()->with('error', 'Failed to create category')->withInput();
        }
    }

    /**
     * Display the specified category
     */
    public function show(Request $request, $id)
    {
        try {
            $category = Category::withCount('books')->findOrFail($id);
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'data' => $category
                ]);
            }
            
            return Inertia::render('Admin/CategoryShow', [
                'category' => $category
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching category: ' . $e->getMessage());
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Category not found',
                    'error' => $e->getMessage()
                ], 404);
            }
            
            return back()->with('error', 'Category not found');
        }
    }

    /**
     * Update the specified category
     */
    public function update(Request $request, $id)
    {
        try {
            $category = Category::findOrFail($id);
            
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255|unique:categories,name,' . $category->id,
                'slug' => 'nullable|string|max:255|unique:categories,slug,' . $category->id,
                'description' => 'nullable|string',
                'color' => 'nullable|string|max:7|regex:/^#[0-9A-Fa-f]{6}$/',
                'is_active' => 'boolean',
                'sort_order' => 'nullable|integer|min:0',
            ]);

            if ($validator->fails()) {
                if ($request->expectsJson()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Validation failed',
                        'errors' => $validator->errors()
                    ], 422);
                }
                
                return back()->withErrors($validator)->withInput();
            }

            $data = $validator->validated();
            
            // Generate slug if name changed and slug not provided
            if (isset($data['name']) && $category->name !== $data['name'] && empty($data['slug'])) {
                $data['slug'] = Str::slug($data['name']);
            }

            $category->update($data);
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'data' => $category,
                    'message' => 'Category updated successfully'
                ]);
            }
            
            return redirect()->route('admin.categories')
                ->with('success', 'Category updated successfully');
        } catch (\Exception $e) {
            Log::error('Error updating category: ' . $e->getMessage());
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to update category',
                    'error' => $e->getMessage()
                ], 500);
            }
            
            return back()->with('error', 'Failed to update category')->withInput();
        }
    }

    /**
     * Remove the specified category
     */
    public function destroy(Request $request, $id)
    {
        try {
            $category = Category::findOrFail($id);
            
            // Check if category has books
            $booksCount = $category->books()->count();
            if ($booksCount > 0) {
                $message = "Cannot delete category '{$category->name}' because it has {$booksCount} book(s) associated with it.";
                
                if ($request->expectsJson()) {
                    return response()->json([
                        'success' => false,
                        'message' => $message,
                        'data' => [
                            'books_count' => $booksCount,
                            'suggestion' => 'Please reassign or delete the books first, or deactivate the category instead.'
                        ]
                    ], 400);
                }
                
                return back()->with('error', $message);
            }
            
            $categoryName = $category->name;
            $category->delete();
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'data' => null,
                    'message' => "Category '{$categoryName}' deleted successfully"
                ]);
            }
            
            return redirect()->route('admin.categories')
                ->with('success', "Category '{$categoryName}' deleted successfully");
        } catch (\Exception $e) {
            Log::error('Error deleting category: ' . $e->getMessage());
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to delete category',
                    'error' => $e->getMessage()
                ], 500);
            }
            
            return back()->with('error', 'Failed to delete category');
        }
    }
}

