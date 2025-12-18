<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Classes extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'class_code',
        'class_name',
        'year_level',
        'section',
        'program',
        'course_id',
        'academic_year_id',
        'semester_id',
        'adviser_id', // ADDED: For class adviser (teacher)
    ];

    // ADDED: Append computed attributes to JSON
    // Temporarily disabled to debug 500 errors
    protected $appends = [
        // 'student_count',
        // 'adviser_name'
    ];

    protected function casts(): array
    {
        return [
            'year_level' => 'integer',
            'course_id' => 'integer',
            'adviser_id' => 'integer',
            'academic_year_id' => 'integer',
            'semester_id' => 'integer',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    // Scopes
    public function scopeByYearLevel($query, int $yearLevel)
    {
        return $query->where('year_level', $yearLevel);
    }

    public function scopeByProgram($query, string $program)
    {
        return $query->where('program', $program);
    }

    public function scopeBySection($query, string $section)
    {
        return $query->where('section', $section);
    }

    public function scopeByAcademicYear($query, int $academicYearId)
    {
        return $query->where('academic_year_id', $academicYearId);
    }

    public function scopeBySemester($query, int $semesterId)
    {
        return $query->where('semester_id', $semesterId);
    }

    public function scopeCurrent($query)
    {
        return $query->whereHas('academicYear', function($q) {
            $q->where('is_current', true);
        })->whereHas('semester', function($q) {
            $q->where('is_current', true);
        });
    }

    // Relationships
    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function semester()
    {
        return $this->belongsTo(Semester::class);
    }

    // ADDED: Adviser relationship (Teacher)
    public function adviser()
    {
        return $this->belongsTo(Teacher::class, 'adviser_id');
    }

    public function students()
    {
        return $this->hasMany(Student::class, 'current_class_id');
    }

    /**
     * Get the course/program this class belongs to
     */
    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    /**
     * Get all enrollments for this class
     */
    public function enrollments()
    {
        return $this->hasMany(Enrollment::class, 'class_id');
    }

    /**
     * Get all enrolled students (via Enrollment entity)
     */
    public function enrolledStudents()
    {
        return $this->belongsToMany(Student::class, 'enrollments', 'class_id', 'student_id')
            ->withPivot(['academic_year_id', 'semester_id', 'enrollment_date', 'status'])
            ->withTimestamps();
    }

    /**
     * Get currently enrolled students
     */
    public function activeEnrollments()
    {
        return $this->enrollments()->where('status', 'enrolled');
    }

    public function classSubjects()
    {
        return $this->hasMany(ClassSubject::class, 'class_id');
    }

    // Accessors for computed fields
    
    /**
     * Get student count as an accessor
     * This will be automatically included in JSON when appends is set
     */
    public function getStudentCountAttribute(): int
    {
        // If students_count is already loaded via withCount, use it
        if (isset($this->attributes['students_count'])) {
            return (int) $this->attributes['students_count'];
        }
        
        // Otherwise, count from relationship
        return $this->students()->count();
    }

    /**
     * Get adviser name as an accessor
     * This will be automatically included in JSON when appends is set
     */
    public function getAdviserNameAttribute(): ?string
    {
        // If adviser relationship is loaded
        if ($this->relationLoaded('adviser') && $this->adviser) {
            return $this->adviser->full_name;
        }
        
        // If adviser_id exists but relationship not loaded
        if ($this->adviser_id) {
            // Load the relationship if needed
            $this->load('adviser');
            return $this->adviser?->full_name;
        }
        
        return null;
    }

    // Helper Methods
    public function getStudentCount(): int
    {
        return $this->students()->count();
    }

    public function getSubjectCount(): int
    {
        return $this->classSubjects()->count();
    }

    public function getTeachers()
    {
        return Teacher::whereIn('id', $this->classSubjects()->pluck('teacher_id'))->get();
    }

    public function getAverageGrade(): ?float
    {
        $grades = Grade::whereIn('class_subject_id', $this->classSubjects()->pluck('id'))
            ->whereNotNull('final_rating')
            ->avg('final_rating');
        
        return $grades ? round($grades, 2) : null;
    }

    public function getAttendanceRate(): float
    {
        $totalAttendance = Attendance::whereIn('class_subject_id', $this->classSubjects()->pluck('id'))
            ->count();
        
        if ($totalAttendance === 0) return 0;
        
        $presentCount = Attendance::whereIn('class_subject_id', $this->classSubjects()->pluck('id'))
            ->where('status', 'Present')
            ->count();
        
        return round(($presentCount / $totalAttendance) * 100, 2);
    }

    // Attributes
    public function getFullNameAttribute(): string
    {
        return "{$this->class_code} - {$this->class_name}";
    }

    public function getDisplayNameAttribute(): string
    {
        return "{$this->program} Year {$this->year_level} Section {$this->section}";
    }

    public function getProgramYearAttribute(): string
    {
        return "{$this->program} - Year {$this->year_level}";
    }
}