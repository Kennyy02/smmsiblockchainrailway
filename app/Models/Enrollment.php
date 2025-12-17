<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Enrollment extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'student_id',
        'class_id',
        'academic_year_id',
        'semester_id',
        'course_id',
        'enrollment_date',
        'status',
        'remarks',
    ];

    protected function casts(): array
    {
        return [
            'enrollment_date' => 'date',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    // ========================================================================
    // RELATIONSHIPS
    // ========================================================================

    /**
     * Get the student for this enrollment
     */
    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    /**
     * Get the class for this enrollment
     */
    public function class()
    {
        return $this->belongsTo(Classes::class, 'class_id');
    }

    /**
     * Get the academic year for this enrollment
     */
    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class);
    }

    /**
     * Get the semester for this enrollment
     */
    public function semester()
    {
        return $this->belongsTo(Semester::class);
    }

    /**
     * Get the course/program for this enrollment
     */
    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    // ========================================================================
    // SCOPES
    // ========================================================================

    public function scopeEnrolled($query)
    {
        return $query->where('status', 'enrolled');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeDropped($query)
    {
        return $query->where('status', 'dropped');
    }

    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function scopeByStudent($query, int $studentId)
    {
        return $query->where('student_id', $studentId);
    }

    public function scopeByClass($query, int $classId)
    {
        return $query->where('class_id', $classId);
    }

    public function scopeByAcademicYear($query, int $academicYearId)
    {
        return $query->where('academic_year_id', $academicYearId);
    }

    public function scopeBySemester($query, int $semesterId)
    {
        return $query->where('semester_id', $semesterId);
    }

    public function scopeByCourse($query, int $courseId)
    {
        return $query->where('course_id', $courseId);
    }

    public function scopeCurrentSemester($query)
    {
        $currentSemester = Semester::where('is_current', true)->first();
        return $currentSemester ? $query->where('semester_id', $currentSemester->id) : $query;
    }

    public function scopeCurrentAcademicYear($query)
    {
        $currentYear = AcademicYear::where('is_current', true)->first();
        return $currentYear ? $query->where('academic_year_id', $currentYear->id) : $query;
    }

    // ========================================================================
    // HELPER METHODS
    // ========================================================================

    /**
     * Check if enrollment is active
     */
    public function isActive(): bool
    {
        return $this->status === 'enrolled';
    }

    /**
     * Mark enrollment as completed
     */
    public function markAsCompleted(): void
    {
        $this->update(['status' => 'completed']);
    }

    /**
     * Mark enrollment as dropped
     */
    public function markAsDropped(string $remarks = null): void
    {
        $this->update([
            'status' => 'dropped',
            'remarks' => $remarks,
        ]);
    }

    /**
     * Get grades for this enrollment's class subjects
     */
    public function getGrades()
    {
        return Grade::where('student_id', $this->student_id)
            ->whereHas('classSubject', function ($q) {
                $q->where('class_id', $this->class_id);
            })
            ->get();
    }

    /**
     * Get attendance for this enrollment's class subjects
     */
    public function getAttendance()
    {
        return Attendance::where('student_id', $this->student_id)
            ->whereHas('classSubject', function ($q) {
                $q->where('class_id', $this->class_id);
            })
            ->get();
    }
}

