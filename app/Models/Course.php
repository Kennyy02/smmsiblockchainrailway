<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Course extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'course_code',
        'course_name',
        'description',
        'level',
        'duration_years',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'duration_years' => 'integer',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    // ========================================================================
    // RELATIONSHIPS
    // ========================================================================

    /**
     * Get all subjects for this course
     */
    public function subjects()
    {
        return $this->belongsToMany(Subject::class, 'course_subjects')
            ->withPivot(['year_level', 'semester', 'is_required'])
            ->withTimestamps();
    }

    /**
     * Get all students enrolled in this course/program
     */
    public function students()
    {
        return $this->hasMany(Student::class);
    }

    /**
     * Get all classes for this course
     */
    public function classes()
    {
        return $this->hasMany(Classes::class);
    }

    /**
     * Get all enrollments for this course
     */
    public function enrollments()
    {
        return $this->hasMany(Enrollment::class);
    }

    // ========================================================================
    // SCOPES
    // ========================================================================

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByLevel($query, string $level)
    {
        return $query->where('level', $level);
    }

    public function scopeCollege($query)
    {
        return $query->where('level', 'College');
    }

    public function scopeSeniorHigh($query)
    {
        return $query->where('level', 'Senior High');
    }

    public function scopeSearch($query, string $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('course_code', 'like', "%{$search}%")
              ->orWhere('course_name', 'like', "%{$search}%")
              ->orWhere('description', 'like', "%{$search}%");
        });
    }

    // ========================================================================
    // ACCESSORS
    // ========================================================================

    /**
     * Get full course display name
     */
    public function getFullNameAttribute(): string
    {
        return "{$this->course_code} - {$this->course_name}";
    }

    /**
     * Get student count
     */
    public function getStudentCountAttribute(): int
    {
        return $this->students()->count();
    }

    /**
     * Get active student count
     */
    public function getActiveStudentCountAttribute(): int
    {
        return $this->students()->where('status', 'active')->count();
    }
}

