<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CourseYearSubject extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'course_id',
        'year_level',
        'subject_id',
        'semester',
        'is_required',
        'units',
        'description',
        'is_active',
    ];

    protected $casts = [
        'year_level' => 'integer',
        'is_required' => 'boolean',
        'units' => 'integer',
        'is_active' => 'boolean',
    ];

    // ========================================================================
    // RELATIONSHIPS
    // ========================================================================

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    // ========================================================================
    // SCOPES
    // ========================================================================

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByCourse($query, $courseId)
    {
        return $query->where('course_id', $courseId);
    }

    public function scopeByYearLevel($query, $yearLevel)
    {
        return $query->where('year_level', $yearLevel);
    }

    public function scopeBySemester($query, $semester)
    {
        return $query->where('semester', $semester);
    }

    public function scopeRequired($query)
    {
        return $query->where('is_required', true);
    }

    public function scopeElective($query)
    {
        return $query->where('is_required', false);
    }

    public function scopeSearch($query, $search)
    {
        return $query->whereHas('subject', function ($q) use ($search) {
            $q->where('subject_code', 'like', "%{$search}%")
              ->orWhere('subject_name', 'like', "%{$search}%");
        })->orWhereHas('course', function ($q) use ($search) {
            $q->where('course_code', 'like', "%{$search}%")
              ->orWhere('course_name', 'like', "%{$search}%");
        });
    }

    // ========================================================================
    // ACCESSORS
    // ========================================================================

    public function getYearLevelFormattedAttribute(): string
    {
        $ordinals = [1 => '1st', 2 => '2nd', 3 => '3rd', 4 => '4th', 5 => '5th'];
        return ($ordinals[$this->year_level] ?? $this->year_level . 'th') . ' Year';
    }

    public function getSubjectTypeAttribute(): string
    {
        return $this->is_required ? 'Required' : 'Elective';
    }
}

