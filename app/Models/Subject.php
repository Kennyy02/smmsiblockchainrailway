<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Subject extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'subject_code',
        'subject_name',
        'description',
        'units',
        'teacher_id', // Kept for backward compatibility, but use teachers() relationship instead
    ];

    protected $appends = ['teacher_name'];

    protected function casts(): array
    {
        return [
            'units' => 'decimal:2',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    // Scopes
    public function scopeSearch($query, string $search)
    {
        return $query->where(function($q) use ($search) {
            $q->where('subject_code', 'like', "%{$search}%")
              ->orWhere('subject_name', 'like', "%{$search}%")
              ->orWhere('description', 'like', "%{$search}%");
        });
    }

    public function scopeByCode($query, string $code)
    {
        return $query->where('subject_code', $code);
    }

    public function scopeOrderByCode($query, string $direction = 'asc')
    {
        return $query->orderBy('subject_code', $direction);
    }

    public function scopeOrderByName($query, string $direction = 'asc')
    {
        return $query->orderBy('subject_name', $direction);
    }

    // Relationships
    
    /**
     * Get the assigned teacher for this subject (legacy - single teacher)
     */
    public function teacher()
    {
        return $this->belongsTo(Teacher::class);
    }

    /**
     * Get all assigned teachers for this subject (many-to-many)
     */
    public function assignedTeachers()
    {
        return $this->belongsToMany(Teacher::class, 'subject_teacher')
            ->withTimestamps();
    }

    /**
     * Get all courses this subject belongs to
     */
    public function courses()
    {
        return $this->belongsToMany(Course::class, 'course_subjects')
            ->withPivot(['year_level', 'semester', 'is_required'])
            ->withTimestamps();
    }

    public function classSubjects()
    {
        return $this->hasMany(ClassSubject::class);
    }

    public function currentClassSubjects()
    {
        return $this->hasMany(ClassSubject::class)
            ->whereHas('academicYear', function($q) {
                $q->where('is_current', true);
            })
            ->whereHas('semester', function($q) {
                $q->where('is_current', true);
            });
    }

    public function classes()
    {
        return $this->hasManyThrough(
            Classes::class,
            ClassSubject::class,
            'subject_id',
            'id',
            'id',
            'class_id'
        );
    }

    public function teachers()
    {
        return $this->hasManyThrough(
            Teacher::class,
            ClassSubject::class,
            'subject_id',
            'id',
            'id',
            'teacher_id'
        );
    }

    public function assignments()
    {
        return $this->hasManyThrough(Assignment::class, ClassSubject::class);
    }

    public function grades()
    {
        return $this->hasManyThrough(Grade::class, ClassSubject::class);
    }

    public function attendance()
    {
        return $this->hasManyThrough(Attendance::class, ClassSubject::class);
    }

    public function courseMaterials()
    {
        return $this->hasManyThrough(CourseMaterial::class, ClassSubject::class);
    }

    // Helper Methods
    public function getActiveClassCount(): int
    {
        return $this->currentClassSubjects()->count();
    }

    public function getTotalClassCount(): int
    {
        return $this->classSubjects()->count();
    }

    public function getEnrolledStudentsCount(): int
    {
        $classIds = $this->classSubjects()->pluck('class_id')->unique();
        return Student::whereIn('current_class_id', $classIds)->count();
    }

    public function getCurrentStudentsCount(): int
    {
        $classIds = $this->currentClassSubjects()->pluck('class_id')->unique();
        return Student::whereIn('current_class_id', $classIds)->count();
    }

    public function getTeachersCount(): int
    {
        return $this->classSubjects()
            ->distinct('teacher_id')
            ->count('teacher_id');
    }

    public function getCurrentTeachers()
    {
        return Teacher::whereIn('id', 
            $this->currentClassSubjects()->pluck('teacher_id')->unique()
        )->get();
    }

    public function getAverageGrade(): ?float
    {
        $average = $this->grades()
            ->whereNotNull('final_rating')
            ->avg('final_rating');
        
        return $average ? round($average, 2) : null;
    }

    public function getPassRate(): float
    {
        $total = $this->grades()->whereNotNull('final_rating')->count();
        if ($total === 0) return 0;

        $passed = $this->grades()->where('remarks', 'Passed')->count();
        return round(($passed / $total) * 100, 2);
    }

    public function getFailRate(): float
    {
        $total = $this->grades()->whereNotNull('final_rating')->count();
        if ($total === 0) return 0;

        $failed = $this->grades()->where('remarks', 'Failed')->count();
        return round(($failed / $total) * 100, 2);
    }

    public function getAverageAttendanceRate(): float
    {
        $totalAttendance = $this->attendance()->count();
        if ($totalAttendance === 0) return 0;

        $presentCount = $this->attendance()->where('status', 'Present')->count();
        return round(($presentCount / $totalAttendance) * 100, 2);
    }

    public function getAssignmentCount(): int
    {
        return $this->assignments()->count();
    }

    public function getSubmissionRate(): float
    {
        $totalAssignments = $this->assignments()->count();
        if ($totalAssignments === 0) return 0;

        $totalSubmissions = StudentSubmission::whereIn(
            'assignment_id',
            $this->assignments()->pluck('id')
        )->whereNotNull('submitted_at')->count();

        $expectedSubmissions = $totalAssignments * $this->getEnrolledStudentsCount();
        if ($expectedSubmissions === 0) return 0;

        return round(($totalSubmissions / $expectedSubmissions) * 100, 2);
    }

    public function getCourseMaterialsCount(): int
    {
        return $this->courseMaterials()->count();
    }

    public function getStatistics(): array
    {
        return [
            'total_classes' => $this->getTotalClassCount(),
            'active_classes' => $this->getActiveClassCount(),
            'enrolled_students' => $this->getEnrolledStudentsCount(),
            'current_students' => $this->getCurrentStudentsCount(),
            'teachers_count' => $this->getTeachersCount(),
            'average_grade' => $this->getAverageGrade(),
            'pass_rate' => $this->getPassRate(),
            'fail_rate' => $this->getFailRate(),
            'attendance_rate' => $this->getAverageAttendanceRate(),
            'assignment_count' => $this->getAssignmentCount(),
            'submission_rate' => $this->getSubmissionRate(),
            'course_materials_count' => $this->getCourseMaterialsCount(),
        ];
    }

    // Attributes
    public function getFullNameAttribute(): string
    {
        return "{$this->subject_code} - {$this->subject_name}";
    }

    public function getDisplayNameAttribute(): string
    {
        return $this->subject_name;
    }

    public function getCodeAttribute(): string
    {
        return $this->subject_code;
    }

    public function getNameAttribute(): string
    {
        return $this->subject_name;
    }

    public function getShortDescriptionAttribute(): string
    {
        if (!$this->description) return 'No description available';
        
        return strlen($this->description) > 100 
            ? substr($this->description, 0, 100) . '...' 
            : $this->description;
    }

    public function getTeacherNameAttribute(): ?string
    {
        if ($this->relationLoaded('teacher') && $this->teacher) {
            return $this->teacher->full_name;
        }
        
        if ($this->teacher_id) {
            $this->load('teacher');
            return $this->teacher?->full_name;
        }
        
        return null;
    }

    public function getUnitsDisplayAttribute(): string
    {
        return $this->units . ' ' . ($this->units == 1 ? 'unit' : 'units');
    }

    // Static Helper Methods
    public static function findByCode(string $code): ?self
    {
        return static::where('subject_code', $code)->first();
    }

    public static function getPopularSubjects(int $limit = 10): \Illuminate\Support\Collection
    {
        return static::withCount('classSubjects')
            ->orderByDesc('class_subjects_count')
            ->limit($limit)
            ->get();
    }

    public static function getSubjectsWithHighPassRate(float $minRate = 80, int $limit = 10): \Illuminate\Support\Collection
    {
        return static::all()->filter(function($subject) use ($minRate) {
            return $subject->getPassRate() >= $minRate;
        })->take($limit);
    }

    public static function getSubjectsNeedingAttention(float $maxPassRate = 70): \Illuminate\Support\Collection
    {
        return static::all()->filter(function($subject) use ($maxPassRate) {
            $passRate = $subject->getPassRate();
            return $passRate > 0 && $passRate < $maxPassRate;
        });
    }

    public static function getTotalUnits(): float
    {
        return static::sum('units');
    }

    public static function getAverageUnits(): float
    {
        $average = static::avg('units');
        return $average ? round($average, 2) : 0;
    }
}