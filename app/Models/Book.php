<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Book extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'isbn',
        'title',
        'author',
        'publisher',
        'publication_year',
        'description',
        'category_id',
        'total_copies',
        'available_copies',
        'location',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'publication_year' => 'integer',
            'total_copies' => 'integer',
            'available_copies' => 'integer',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    // Scopes
    public function scopeSearch($query, string $search)
    {
        return $query->where(function($q) use ($search) {
            $q->where('title', 'like', "%{$search}%")
              ->orWhere('author', 'like', "%{$search}%")
              ->orWhere('isbn', 'like', "%{$search}%")
              ->orWhere('publisher', 'like', "%{$search}%");
        });
    }

    public function scopeAvailable($query)
    {
        return $query->where('available_copies', '>', 0)
                     ->where('status', 'available');
    }

    public function scopeByCategory($query, $categoryId)
    {
        if (is_numeric($categoryId)) {
            return $query->where('category_id', $categoryId);
        }
        // Support slug or name lookup
        return $query->whereHas('category', function($q) use ($categoryId) {
            $q->where('slug', $categoryId)->orWhere('name', $categoryId);
        });
    }

    public function scopeOrderByTitle($query, string $direction = 'asc')
    {
        return $query->orderBy('title', $direction);
    }

    // Helper Methods
    public function isAvailable(): bool
    {
        return $this->available_copies > 0 && $this->status === 'available';
    }

    public function getBorrowedCopiesAttribute(): int
    {
        return $this->total_copies - $this->available_copies;
    }

    // Relationships
    public function category()
    {
        return $this->belongsTo(Category::class);
    }
}

