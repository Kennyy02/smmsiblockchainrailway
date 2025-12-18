<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Student extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'student_id',
        'first_name',
        'middle_name',
        'last_name',
        'email',
        'phone',
        'date_of_birth',
        'gender',
        'address',
        'program',
        'year_level',
        'current_class_id',
    ];

    // CRITICAL: Add full_name and section to appends so they're included in JSON responses
    // Temporarily disabled to debug 500 errors
    protected $appends = [
        // 'full_name',
        // 'section',
    ];

    protected function casts(): array
    {
        return [
            'date_of_birth' => 'date',
            'enrollment_date' => 'date',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    // ========================================================================
    // RELATIONSHIPS
    // ========================================================================

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function currentClass()
    {
        return $this->belongsTo(Classes::class, 'current_class_id');
    }

    /**
     * Get the course/program the student is enrolled in
     */
    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    /**
     * Get all enrollments for this student (class history)
     */
    public function enrollments()
    {
        return $this->hasMany(Enrollment::class);
    }

    /**
     * Get all classes the student is enrolled in (via Enrollment)
     */
    public function classes()
    {
        return $this->belongsToMany(Classes::class, 'enrollments', 'student_id', 'class_id')
            ->withPivot(['academic_year_id', 'semester_id', 'enrollment_date', 'status'])
            ->withTimestamps();
    }

    /**
     * Get current semester enrollments
     */
    public function currentEnrollments()
    {
        return $this->enrollments()
            ->whereHas('semester', function ($q) {
                $q->where('is_current', true);
            })
            ->enrolled();
    }

    public function grades()
    {
        return $this->hasMany(Grade::class);
    }

    public function attendance()
    {
        return $this->hasMany(Attendance::class);
    }

    public function parents()
    {
        return $this->belongsToMany(ParentModel::class, 'parent_student', 'student_id', 'parent_id')
            ->withPivot('relationship')
            ->withTimestamps();
    }

    // ========================================================================
    // ACCESSORS
    // ========================================================================

    /**
     * Get the student's full name
     * CRITICAL: This accessor must be defined for the frontend to display names correctly
     */
    public function getFullNameAttribute(): string
    {
        $name = $this->first_name;
        
        if ($this->middle_name) {
            $name .= ' ' . substr($this->middle_name, 0, 1) . '.';
        }
        
        $name .= ' ' . $this->last_name;
        
        return $name;
    }

    /**
     * Get full name with middle name (complete)
     */
    public function getFullNameWithMiddleAttribute(): string
    {
        $name = $this->first_name;
        
        if ($this->middle_name) {
            $name .= ' ' . $this->middle_name;
        }
        
        $name .= ' ' . $this->last_name;
        
        return $name;
    }

    /**
     * Get the student's section from their current class or active enrollment
     */
    public function getSectionAttribute(): ?string
    {
        // First try from current_class_id - load relationship if needed
        if ($this->current_class_id) {
            $currentClass = $this->relationLoaded('currentClass') 
                ? $this->currentClass 
                : $this->currentClass()->first();
            
            if ($currentClass) {
                return $currentClass->section;
            }
        }

        // Otherwise try from active enrollment
        $activeEnrollment = $this->enrollments()
            ->where('status', 'enrolled')
            ->with('class')
            ->latest()
            ->first();

        if ($activeEnrollment && $activeEnrollment->class) {
            return $activeEnrollment->class->section;
        }

        return null;
    }

    // ========================================================================
    // SCOPES
    // ========================================================================

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeByProgram($query, string $program)
    {
        return $query->where('program', $program);
    }

    public function scopeByYearLevel($query, int $yearLevel)
    {
        return $query->where('year_level', $yearLevel);
    }

    public function scopeSearch($query, string $search)
    {
        return $query->where(function($q) use ($search) {
            $q->where('student_id', 'like', "%{$search}%")
              ->orWhere('first_name', 'like', "%{$search}%")
              ->orWhere('last_name', 'like', "%{$search}%")
              ->orWhere('email', 'like', "%{$search}%");
        });
    }

    // ========================================================================
    // HELPER METHODS
    // ========================================================================

    public function getGPA(): float
    {
        $grades = $this->grades()
            ->whereNotNull('final_rating')
            ->get();

        if ($grades->isEmpty()) {
            return 0.0;
        }

        $totalGPA = 0;
        $totalUnits = 0;

        foreach ($grades as $grade) {
            $units = $grade->classSubject->subject->units ?? 3;
            $gpa = $grade->getGPA() ?? 0;
            $totalGPA += $gpa * $units;
            $totalUnits += $units;
        }

        return $totalUnits > 0 ? round($totalGPA / $totalUnits, 2) : 0.0;
    }

    public function getAverageGrade(): float
    {
        return $this->grades()
            ->whereNotNull('final_rating')
            ->avg('final_rating') ?? 0.0;
    }

    public function getTotalUnitsEnrolled(): int
    {
        return $this->grades()
            ->with('classSubject.subject')
            ->get()
            ->sum(function($grade) {
                return $grade->classSubject->subject->units ?? 3;
            });
    }

    public function getPassedUnits(): int
    {
        return $this->grades()
            ->where('remarks', 'Passed')
            ->with('classSubject.subject')
            ->get()
            ->sum(function($grade) {
                return $grade->classSubject->subject->units ?? 3;
            });
    }
}