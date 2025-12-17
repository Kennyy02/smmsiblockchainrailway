<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Assignment extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'class_subject_id',
        'title',
        'description',
        'assignment_type',
        'total_points',
        'due_date',
    ];

    protected function casts(): array
    {
        return [
            'total_points' => 'integer',
            'due_date' => 'date',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    // Scopes
    public function scopeByType($query, string $type)
    {
        return $query->where('assignment_type', $type);
    }

    public function scopeUpcoming($query)
    {
        return $query->where('due_date', '>=', now());
    }

    public function scopeOverdue($query)
    {
        return $query->where('due_date', '<', now());
    }

    public function scopeDueSoon($query, int $days = 7)
    {
        return $query->whereBetween('due_date', [now(), now()->addDays($days)]);
    }

    // Relationships
    public function classSubject()
    {
        return $this->belongsTo(ClassSubject::class);
    }

    public function submissions()
    {
        return $this->hasMany(StudentSubmission::class);
    }

    public function submittedSubmissions()
    {
        return $this->hasMany(StudentSubmission::class)->whereNotNull('submitted_at');
    }

    public function gradedSubmissions()
    {
        return $this->hasMany(StudentSubmission::class)->whereNotNull('score');
    }

    // Helper Methods
    public function getSubmissionRate(): float
    {
        $totalStudents = $this->classSubject->class->students()->count();
        if ($totalStudents === 0) return 0;
        
        $submittedCount = $this->submittedSubmissions()->count();
        return round(($submittedCount / $totalStudents) * 100, 2);
    }

    public function getAverageScore(): ?float
    {
        $average = $this->gradedSubmissions()->avg('score');
        return $average ? round($average, 2) : null;
    }

    public function isOverdue(): bool
    {
        return $this->due_date->isPast();
    }

    public function isDueSoon(int $days = 7): bool
    {
        return $this->due_date->isFuture() && $this->due_date->diffInDays(now()) <= $days;
    }

    // Attributes
    public function getFullTitleAttribute(): string
    {
        return "{$this->assignment_type}: {$this->title}";
    }

    public function getStatusAttribute(): string
    {
        if ($this->isOverdue()) {
            return 'overdue';
        } elseif ($this->isDueSoon()) {
            return 'due_soon';
        }
        return 'open';
    }
}