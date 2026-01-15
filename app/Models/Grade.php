<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Grade extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'student_id',
        'class_subject_id',
        'academic_year_id',
        'semester_id',
        'prelim_grade',
        'midterm_grade',
        'final_grade',
        'final_rating',
        'remarks',
    ];

    protected $appends = [
        'student_name',
        'class_name',
        'subject_name',
        'subject_code',
    ];

    protected function casts(): array
    {
        return [
            'prelim_grade' => 'decimal:2',
            'midterm_grade' => 'decimal:2',
            'final_grade' => 'decimal:2',
            'final_rating' => 'decimal:2',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    // ========================================================================
    // SCOPES
    // ========================================================================

    public function scopeByStudent($query, int $studentId)
    {
        return $query->where('student_id', $studentId);
    }

    public function scopeByAcademicYear($query, int $academicYearId)
    {
        return $query->where('academic_year_id', $academicYearId);
    }

    public function scopeBySemester($query, int $semesterId)
    {
        return $query->where('semester_id', $semesterId);
    }

    public function scopePassed($query)
    {
        return $query->where('remarks', 'Passed');
    }

    public function scopeFailed($query)
    {
        return $query->where('remarks', 'Failed');
    }

    public function scopeIncomplete($query)
    {
        return $query->where('remarks', 'Incomplete');
    }

    // ========================================================================
    // RELATIONSHIPS
    // ========================================================================

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function classSubject()
    {
        return $this->belongsTo(ClassSubject::class);
    }

    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function semester()
    {
        return $this->belongsTo(Semester::class);
    }

    // ========================================================================
    // ACCESSORS (For JSON responses)
    // ========================================================================

    /**
     * Get the student's full name
     */
    public function getStudentNameAttribute(): ?string
    {
        if (!$this->relationLoaded('student')) {
            $this->load('student');
        }
        
        return optional($this->student)->full_name;
    }

    /**
     * Get the class name
     */
    public function getClassNameAttribute(): ?string
    {
        if (!$this->relationLoaded('classSubject')) {
            $this->load('classSubject.class');
        }
        
        return optional($this->classSubject?->class)->class_name 
            ?? optional($this->classSubject?->class)->class_code;
    }

    /**
     * Get the subject name
     */
    public function getSubjectNameAttribute(): ?string
    {
        if (!$this->relationLoaded('classSubject')) {
            $this->load('classSubject.subject');
        }
        
        return optional($this->classSubject?->subject)->subject_name;
    }

    /**
     * Get the subject code
     */
    public function getSubjectCodeAttribute(): ?string
    {
        if (!$this->relationLoaded('classSubject')) {
            $this->load('classSubject.subject');
        }
        
        return optional($this->classSubject?->subject)->subject_code;
    }

    // ========================================================================
    // HELPER METHODS
    // ========================================================================

    public function calculateFinalRating(): float
    {
        // Simple average: (Prelim + Midterm + Final) / 3
        $prelim = $this->prelim_grade ?? 0;
        $midterm = $this->midterm_grade ?? 0;
        $final = $this->final_grade ?? 0;

        return round(($prelim + $midterm + $final) / 3, 2);
    }

    public function updateFinalRating(): void
    {
        if ($this->prelim_grade && $this->midterm_grade && $this->final_grade) {
            $this->final_rating = $this->calculateFinalRating();
            $this->remarks = $this->final_rating >= 75 ? 'Passed' : 'Failed';
            $this->save();
        }
    }

    public function isComplete(): bool
    {
        return !is_null($this->prelim_grade) 
            && !is_null($this->midterm_grade) 
            && !is_null($this->final_grade);
    }

    public function isPassed(): bool
    {
        return $this->remarks === 'Passed';
    }

    public function isFailed(): bool
    {
        return $this->remarks === 'Failed';
    }

    public function getLetterGrade(): ?string
    {
        if (is_null($this->final_rating)) return null;

        $rating = $this->final_rating;
        if ($rating >= 95) return 'A+';
        if ($rating >= 90) return 'A';
        if ($rating >= 85) return 'B+';
        if ($rating >= 80) return 'B';
        if ($rating >= 75) return 'C+';
        if ($rating >= 70) return 'C';
        if ($rating >= 65) return 'D';
        return 'F';
    }

    public function getGPA(): ?float
    {
        if (is_null($this->final_rating)) return null;

        $rating = $this->final_rating;
        if ($rating >= 95) return 4.0;
        if ($rating >= 90) return 3.5;
        if ($rating >= 85) return 3.0;
        if ($rating >= 80) return 2.5;
        if ($rating >= 75) return 2.0;
        if ($rating >= 70) return 1.5;
        if ($rating >= 65) return 1.0;
        return 0.0;
    }

    // Attributes
    public function getCompletionPercentageAttribute(): float
    {
        $completed = 0;
        if ($this->prelim_grade) $completed++;
        if ($this->midterm_grade) $completed++;
        if ($this->final_grade) $completed++;

        return round(($completed / 3) * 100, 2);
    }

    // ========================================================================
    // BLOCKCHAIN METHODS
    // ========================================================================

    /**
     * Generate a blockchain hash for this grade record
     * This hash ensures data integrity and prevents tampering
     */
    public function generateBlockchainHash(): string
    {
        // Ensure relationships are loaded
        if (!$this->relationLoaded('student')) {
            $this->load('student');
        }
        if (!$this->relationLoaded('classSubject')) {
            $this->load('classSubject.subject');
        }
        if (!$this->relationLoaded('academicYear')) {
            $this->load('academicYear');
        }
        if (!$this->relationLoaded('semester')) {
            $this->load('semester');
        }

        // Create a data structure that uniquely identifies this grade
        $data = [
            'grade_id' => $this->id,
            'student_id' => $this->student_id,
            'student_name' => $this->student ? ($this->student->first_name . ' ' . $this->student->last_name) : null,
            'class_subject_id' => $this->class_subject_id,
            'subject_code' => $this->classSubject?->subject?->subject_code,
            'subject_name' => $this->classSubject?->subject?->subject_name,
            'academic_year_id' => $this->academic_year_id,
            'academic_year' => $this->academicYear?->year_name,
            'semester_id' => $this->semester_id,
            'semester' => $this->semester?->semester_name,
            'prelim_grade' => $this->prelim_grade,
            'midterm_grade' => $this->midterm_grade,
            'final_grade' => $this->final_grade,
            'final_rating' => $this->final_rating,
            'remarks' => $this->remarks,
            'created_at' => $this->created_at ? $this->created_at->toIso8601String() : null,
            'updated_at' => $this->updated_at ? $this->updated_at->toIso8601String() : null,
            'timestamp' => now()->timestamp,
        ];

        // Sort data to ensure consistent hashing
        ksort($data);
        return hash('sha256', json_encode($data, JSON_UNESCAPED_UNICODE));
    }

    /**
     * Verify the integrity of the grade by regenerating and comparing the hash
     */
    public function verifyIntegrity(string $storedHash): bool
    {
        $currentHash = $this->generateBlockchainHash();
        return hash_equals($storedHash, $currentHash);
    }

    /**
     * Register this grade on the blockchain
     * Creates a blockchain transaction record for audit purposes
     */
    public function registerOnBlockchain(bool $isUpdate = false): void
    {
        // Generate the grade hash
        $blockchainHash = $this->generateBlockchainHash();
        
        // Get the user ID for initiated_by
        // Try to get from authenticated user first
        $initiatedBy = auth()->id();
        
        // If no authenticated user, try to get from class subject's teacher
        if (!$initiatedBy && $this->classSubject) {
            if (!$this->relationLoaded('classSubject')) {
                $this->load('classSubject.teacher');
            }
            if ($this->classSubject?->teacher?->user_id) {
                $initiatedBy = $this->classSubject->teacher->user_id;
            }
        }
        
        // If still no user ID, get the first admin user as fallback
        if (!$initiatedBy) {
            $adminUser = User::where('role', 'admin')->first();
            if ($adminUser) {
                $initiatedBy = $adminUser->id;
            }
        }

        // Create blockchain transaction record
        if ($initiatedBy) {
            try {
                BlockchainTransaction::create([
                    'transaction_hash' => $blockchainHash,
                    'transaction_type' => $isUpdate ? 'grade_update' : 'grade_creation',
                    'initiated_by' => $initiatedBy,
                    'status' => 'confirmed', // Grades are immediately confirmed as they're stored in our system
                    'submitted_at' => now(),
                ]);
            } catch (\Exception $e) {
                // Log but don't fail - grade is already saved
                \Log::warning('Failed to create blockchain transaction for grade: ' . $e->getMessage(), [
                    'grade_id' => $this->id,
                    'error' => $e->getMessage()
                ]);
            }
        }
    }
}