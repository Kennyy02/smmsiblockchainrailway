<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class StudentSubmission extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'assignment_id',
        'student_id',
        'submission_text',
        'submitted_at',
        'score',
        'teacher_feedback',
    ];

    protected function casts(): array
    {
        return [
            'submitted_at' => 'datetime',
            'score' => 'decimal:2',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    // Scopes
    public function scopeSubmitted($query)
    {
        return $query->whereNotNull('submitted_at');
    }

    public function scopeGraded($query)
    {
        return $query->whereNotNull('score');
    }

    public function scopeUngraded($query)
    {
        return $query->whereNotNull('submitted_at')->whereNull('score');
    }

    public function scopePending($query)
    {
        return $query->whereNull('submitted_at');
    }

    public function scopeByStudent($query, int $studentId)
    {
        return $query->where('student_id', $studentId);
    }

    // Relationships
    public function assignment()
    {
        return $this->belongsTo(Assignment::class);
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    // Helper Methods
    public function isSubmitted(): bool
    {
        return !is_null($this->submitted_at);
    }

    public function isGraded(): bool
    {
        return !is_null($this->score);
    }

    public function isLate(): bool
    {
        if (!$this->isSubmitted()) return false;
        return $this->submitted_at->isAfter($this->assignment->due_date);
    }

    public function getPercentageScore(): ?float
    {
        if (!$this->isGraded()) return null;
        
        $totalPoints = $this->assignment->total_points;
        if ($totalPoints === 0) return 0;
        
        return round(($this->score / $totalPoints) * 100, 2);
    }

    public function getLetterGrade(): ?string
    {
        $percentage = $this->getPercentageScore();
        if (is_null($percentage)) return null;

        if ($percentage >= 95) return 'A+';
        if ($percentage >= 90) return 'A';
        if ($percentage >= 85) return 'B+';
        if ($percentage >= 80) return 'B';
        if ($percentage >= 75) return 'C+';
        if ($percentage >= 70) return 'C';
        if ($percentage >= 65) return 'D';
        return 'F';
    }

    // Attributes
    public function getStatusAttribute(): string
    {
        if (!$this->isSubmitted()) return 'pending';
        if (!$this->isGraded()) return 'submitted';
        return 'graded';
    }
}