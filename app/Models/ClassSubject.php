<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ClassSubject extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'class_id',
        'subject_id',
        'teacher_id',
        'academic_year_id',
        'semester_id',
    ];

    // CRITICAL: Append new student-specific accessors
    protected $appends = [
        'class_name', 
        'subject_name', 
        'teacher_name', 
        'academic_year_name', 
        'semester_name',
        'student_average_grade', // <<< ADDED FOR STUDENT VIEW >>>
        'student_attendance_rate' // <<< ADDED FOR STUDENT VIEW >>>
    ];

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }
    
    // ========================================================================
    // RELATIONSHIPS (Existing relationships remain the same)
    // ========================================================================

    public function class()
    {
        return $this->belongsTo(Classes::class, 'class_id');
    }

    public function subject()
    {
        return $this->belongsTo(Subject::class);
    }

    public function teacher()
    {
        return $this->belongsTo(Teacher::class);
    }

    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function semester()
    {
        return $this->belongsTo(Semester::class);
    }

    public function assignments()
    {
        return $this->hasMany(Assignment::class);
    }

    public function grades()
    {
        return $this->hasMany(Grade::class);
    }

    public function attendance()
    {
        return $this->hasMany(Attendance::class);
    }

    public function courseMaterials()
    {
        return $this->hasMany(CourseMaterial::class);
    }

    // ========================================================================
    // ACCESSORS (Retrieve names and dynamic student metrics)
    // ========================================================================

    public function getClassNameAttribute(): ?string
    {
        return optional($this->class)->class_name;
    }

    public function getSubjectNameAttribute(): ?string
    {
        return optional($this->subject)->subject_name;
    }

    public function getTeacherNameAttribute(): ?string
    {
        if (!$this->teacher_id) {
            return null;
        }
        if (!$this->relationLoaded('teacher')) {
            $this->load('teacher');
        }
        return optional($this->teacher)->full_name;
    }

    public function getAcademicYearNameAttribute(): ?string
    {
        return optional($this->academicYear)->year_name;
    }

    public function getSemesterNameAttribute(): ?string
    {
        return optional($this->semester)->semester_name;
    }
    
    /**
     * Placeholder accessor. Value set dynamically in the controller.
     */
    public function getStudentAverageGradeAttribute()
    {
        return $this->attributes['student_average_grade'] ?? null;
    }

    /**
     * Placeholder accessor. Value set dynamically in the controller.
     */
    public function getStudentAttendanceRateAttribute()
    {
        return $this->attributes['student_attendance_rate'] ?? null;
    }
    
    // ========================================================================
    // NEW STUDENT-SPECIFIC HELPER METHODS
    // ========================================================================

    /**
     * Calculates the average final rating for a specific student in this class subject.
     */
    public function getAverageGradeForStudent(int $studentId): ?float
    {
        $average = $this->grades()
            ->where('student_id', $studentId) // <-- CRITICAL: Filter by student
            ->whereNotNull('final_rating')
            ->avg('final_rating');
            
        return $average ? round($average, 2) : null;
    }

    /**
     * Calculates the attendance rate for a specific student in this class subject.
     */
    public function getAttendanceRateForStudent(int $studentId): float
    {
        // Get total number of unique days recorded for this class subject
        // This is a simplified approach; assumes the total is the total *present* or *recorded* days
        $totalRecordedDays = $this->attendance()
            ->selectRaw('DATE(attendance_date)')
            ->distinct()
            ->count('attendance_date');
            
        if ($totalRecordedDays === 0) return 0;
        
        // Count the number of 'Present' records for the specific student
        $presentCount = $this->attendance()
            ->where('student_id', $studentId) // <-- CRITICAL: Filter by student
            ->where('status', 'Present')
            ->count();
        
        // Use the total recorded days (unique dates) as the divisor for the student's rate
        return round(($presentCount / $totalRecordedDays) * 100, 2);
    }
    
    // ========================================================================
    // HELPER METHODS (Existing methods remain the same)
    // ========================================================================

    public function getStudentCount(): int
    {
        return $this->class ? $this->class->getStudentCount() : 0;
    }

    public function getAssignmentCount(): int
    {
        return $this->assignments()->count();
    }

    public function getSubmissionCount(): int
    {
        // NOTE: StudentSubmission model is not explicitly available here, but assuming it is defined
        // We will assume a different model (or simply use the class's relationship) to avoid errors
        return $this->assignments()->withCount('submissions')->get()->sum('submissions_count');
    }

    public function getAverageGrade(): ?float
    {
        $average = $this->grades()->whereNotNull('final_rating')->avg('final_rating');
        return $average ? round($average, 2) : null;
    }

    public function getAttendanceRate(): float
    {
        $total = $this->attendance()->count();
        if ($total === 0) return 0;
        
        $present = $this->attendance()->where('status', 'Present')->count();
        return round(($present / $total) * 100, 2);
    }
}