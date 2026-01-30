<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class StudentSubjectEnrollment extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'student_id',
        'course_year_subject_id',
        'academic_year_id',
        'semester_id',
        'class_subject_id',
        'status',
        'is_retake',
        'enrolled_at',
        'completed_at',
        'remarks',
    ];

    protected function casts(): array
    {
        return [
            'is_retake' => 'boolean',
            'enrolled_at' => 'datetime',
            'completed_at' => 'datetime',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    public const STATUS_ENROLLED = 'enrolled';
    public const STATUS_PASSED = 'passed';
    public const STATUS_FAILED = 'failed';
    public const STATUS_DROPPED = 'dropped';
    public const STATUS_INCOMPLETE = 'incomplete';

    // ========================================================================
    // RELATIONSHIPS
    // ========================================================================

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function courseYearSubject()
    {
        return $this->belongsTo(CourseYearSubject::class);
    }

    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function semester()
    {
        return $this->belongsTo(Semester::class);
    }

    public function classSubject()
    {
        return $this->belongsTo(ClassSubject::class);
    }

    // ========================================================================
    // SCOPES
    // ========================================================================

    public function scopeByStudent($query, int $studentId)
    {
        return $query->where('student_id', $studentId);
    }

    public function scopeByTerm($query, int $academicYearId, int $semesterId)
    {
        return $query->where('academic_year_id', $academicYearId)->where('semester_id', $semesterId);
    }

    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function scopeEnrolled($query)
    {
        return $query->where('status', self::STATUS_ENROLLED);
    }

    public function scopePassed($query)
    {
        return $query->where('status', self::STATUS_PASSED);
    }

    public function scopeFailed($query)
    {
        return $query->where('status', self::STATUS_FAILED);
    }

    public function scopeRetakes($query)
    {
        return $query->where('is_retake', true);
    }

    /**
     * Find enrollment by student, class_subject, and term (for syncing from Grade).
     */
    public function scopeByClassSubjectAndTerm($query, int $studentId, int $classSubjectId, int $academicYearId, int $semesterId)
    {
        return $query
            ->byStudent($studentId)
            ->where('class_subject_id', $classSubjectId)
            ->where('academic_year_id', $academicYearId)
            ->where('semester_id', $semesterId);
    }

    // ========================================================================
    // HELPERS
    // ========================================================================

    /**
     * Check if this enrollment is for a required subject (from curriculum).
     */
    public function isRequired(): bool
    {
        return $this->courseYearSubject && $this->courseYearSubject->is_required;
    }

    /**
     * Mark as passed/failed/incomplete and set completed_at when finalized.
     */
    public function markCompleted(string $status, ?string $remarks = null): void
    {
        $data = ['status' => $status, 'remarks' => $remarks];
        if (in_array($status, [self::STATUS_PASSED, self::STATUS_FAILED], true)) {
            $data['completed_at'] = now();
        }
        $this->update($data);
    }

    /**
     * Whether the student is "irregular" due to a failed required subject.
     * Call on Student: has any failed required subject enrollment with no later passed enrollment for same curriculum subject.
     */
    public static function studentIsIrregular(int $studentId): bool
    {
        $failedRequired = static::query()
            ->byStudent($studentId)
            ->byStatus(self::STATUS_FAILED)
            ->whereHas('courseYearSubject', fn ($q) => $q->where('is_required', true))
            ->get();

        foreach ($failedRequired as $enrollment) {
            $hasPassedRetake = static::query()
                ->byStudent($studentId)
                ->where('course_year_subject_id', $enrollment->course_year_subject_id)
                ->byStatus(self::STATUS_PASSED)
                ->where('id', '!=', $enrollment->id)
                ->exists();
            if (!$hasPassedRetake) {
                return true;
            }
        }
        return false;
    }
}
