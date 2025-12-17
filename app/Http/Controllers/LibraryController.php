<?php

namespace App\Http\Controllers;

use App\Models\Book;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class LibraryController extends Controller
{
    /**
     * Display a listing of books
     */
    public function index(Request $request)
    {
        try {
            $query = Book::with('category');
            
            // Apply search filter
            if ($search = $request->input('search')) {
                $query->search($search);
            }
            
            // Apply category filter (can be category_id or category name/slug)
            if ($category = $request->input('category')) {
                if (is_numeric($category)) {
                    $query->where('category_id', $category);
                } else {
                    $query->byCategory($category);
                }
            }
            
            // Apply sorting
            $sortBy = $request->input('sort_by', 'title');
            $sortOrder = $request->input('sort_order', 'asc');
            $query->orderBy($sortBy, $sortOrder);
            
            // Check if request expects JSON (API call)
            if ($request->expectsJson()) {
                if ($request->input('paginate', true)) {
                    $perPage = $request->input('per_page', 15);
                    $books = $query->paginate($perPage);
                    
                    return response()->json([
                        'success' => true,
                        'data' => $books->items(),
                        'pagination' => [
                            'current_page' => $books->currentPage(),
                            'last_page' => $books->lastPage(),
                            'per_page' => $books->perPage(),
                            'total' => $books->total()
                        ]
                    ]);
                } else {
                    $books = $query->get();
                    return response()->json([
                        'success' => true,
                        'data' => $books
                    ]);
                }
            }
            
            // Return Inertia view
            $perPage = $request->input('per_page', 15);
            $books = $query->paginate($perPage);
            
            return Inertia::render('Admin/Library', [
                'books' => $books,
                'filters' => $request->only(['search', 'category', 'sort_by', 'sort_order'])
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching books: ' . $e->getMessage());
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to retrieve books',
                    'error' => $e->getMessage()
                ], 500);
            }
            
            return back()->with('error', 'Failed to retrieve books');
        }
    }

    /**
     * Get library statistics
     */
    public function getStats(Request $request)
    {
        try {
            $totalBooks = Book::count();
            $availableBooks = Book::available()->count();
            $borrowedBooks = Book::where('status', 'borrowed')->count();
            $lostBooks = Book::where('status', 'lost')->count();
            $totalCopies = Book::sum('total_copies');
            $availableCopies = Book::sum('available_copies');
            
            $byCategory = \App\Models\Category::withCount('books')
                ->having('books_count', '>', 0)
                ->get()
                ->mapWithKeys(function($category) {
                    return [$category->name => $category->books_count];
                });
            
            return response()->json([
                'success' => true,
                'data' => [
                    'total_books' => $totalBooks,
                    'available_books' => $availableBooks,
                    'borrowed_books' => $borrowedBooks,
                    'lost_books' => $lostBooks,
                    'total_copies' => $totalCopies,
                    'available_copies' => $availableCopies,
                    'borrowed_copies' => $totalCopies - $availableCopies,
                    'by_category' => $byCategory->toArray(),
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching library stats: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve library stats',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created book
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'title' => 'required|string|max:255',
                'author' => 'nullable|string|max:255',
                'isbn' => 'nullable|string|max:20|unique:books',
                'publisher' => 'nullable|string|max:255',
                'publication_year' => 'nullable|integer|min:1000|max:' . (date('Y') + 1),
                'description' => 'nullable|string',
                'category_id' => 'required|exists:categories,id',
                'total_copies' => 'required|integer|min:1',
                'available_copies' => 'required|integer|min:0',
                'location' => 'nullable|string|max:255',
                'status' => 'required|in:available,borrowed,maintenance,lost',
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
            // Ensure available_copies doesn't exceed total_copies
            if ($data['available_copies'] > $data['total_copies']) {
                $data['available_copies'] = $data['total_copies'];
            }

            $book = Book::create($data);
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'data' => $book,
                    'message' => 'Book added successfully'
                ], 201);
            }
            
            return redirect()->route('admin.library')
                ->with('success', 'Book added successfully');
        } catch (\Exception $e) {
            Log::error('Error creating book: ' . $e->getMessage());
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to create book',
                    'error' => $e->getMessage()
                ], 500);
            }
            
            return back()->with('error', 'Failed to create book')->withInput();
        }
    }

    /**
     * Display the specified book
     */
    public function show(Request $request, $id)
    {
        try {
            $book = Book::with('category')->findOrFail($id);
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'data' => $book
                ]);
            }
            
            return Inertia::render('Admin/LibraryShow', [
                'book' => $book
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching book: ' . $e->getMessage());
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Book not found',
                    'error' => $e->getMessage()
                ], 404);
            }
            
            return back()->with('error', 'Book not found');
        }
    }

    /**
     * Update the specified book
     */
    public function update(Request $request, $id)
    {
        try {
            $book = Book::findOrFail($id);
            
            $validator = Validator::make($request->all(), [
                'title' => 'required|string|max:255',
                'author' => 'nullable|string|max:255',
                'isbn' => 'nullable|string|max:20|unique:books,isbn,' . $book->id,
                'publisher' => 'nullable|string|max:255',
                'publication_year' => 'nullable|integer|min:1000|max:' . (date('Y') + 1),
                'description' => 'nullable|string',
                'category_id' => 'required|exists:categories,id',
                'total_copies' => 'required|integer|min:1',
                'available_copies' => 'required|integer|min:0',
                'location' => 'nullable|string|max:255',
                'status' => 'required|in:available,borrowed,maintenance,lost',
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
            // Ensure available_copies doesn't exceed total_copies
            if ($data['available_copies'] > $data['total_copies']) {
                $data['available_copies'] = $data['total_copies'];
            }

            $book->update($data);
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'data' => $book,
                    'message' => 'Book updated successfully'
                ]);
            }
            
            return redirect()->route('admin.library')
                ->with('success', 'Book updated successfully');
        } catch (\Exception $e) {
            Log::error('Error updating book: ' . $e->getMessage());
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to update book',
                    'error' => $e->getMessage()
                ], 500);
            }
            
            return back()->with('error', 'Failed to update book')->withInput();
        }
    }

    /**
     * Remove the specified book
     */
    public function destroy(Request $request, $id)
    {
        try {
            $book = Book::findOrFail($id);
            $bookTitle = $book->title;
            $book->delete();
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'data' => null,
                    'message' => "Book '{$bookTitle}' deleted successfully"
                ]);
            }
            
            return redirect()->route('admin.library')
                ->with('success', "Book '{$bookTitle}' deleted successfully");
        } catch (\Exception $e) {
            Log::error('Error deleting book: ' . $e->getMessage());
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to delete book',
                    'error' => $e->getMessage()
                ], 500);
            }
            
            return back()->with('error', 'Failed to delete book');
        }
    }
}

