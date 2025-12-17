<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Attendance extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'class_subject_id',
        'student_id',
        'attendance_date',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'attendance_date' => 'date',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    // Scopes
    public function scopeByStudent($query, int $studentId)
    {
        return $query->where('student_id', $studentId);
    }

    public function scopeByClassSubject($query, int $classSubjectId)
    {
        return $query->where('class_subject_id', $classSubjectId);
    }

    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('attendance_date', [$startDate, $endDate]);
    }

    public function scopePresent($query)
    {
        return $query->where('status', 'Present');
    }

    public function scopeAbsent($query)
    {
        return $query->where('status', 'Absent');
    }

    public function scopeLate($query)
    {
        return $query->where('status', 'Late');
    }

    public function scopeExcused($query)
    {
        return $query->where('status', 'Excused');
    }

    // Relationships
    public function classSubject()
    {
        return $this->belongsTo(ClassSubject::class);
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    // Helper Methods
    public static function getAttendanceStats(int $studentId, int $classSubjectId): array
    {
        $query = self::where('student_id', $studentId)
            ->where('class_subject_id', $classSubjectId);

        $total = $query->count();
        $present = $query->clone()->present()->count();
        $absent = $query->clone()->absent()->count();
        $late = $query->clone()->late()->count();
        $excused = $query->clone()->excused()->count();

        $attendanceRate = $total > 0 ? round(($present / $total) * 100, 2) : 0;

        return [
            'total' => $total,
            'present' => $present,
            'absent' => $absent,
            'late' => $late,
            'excused' => $excused,
            'attendance_rate' => $attendanceRate,
        ];
    }

    public function isPresent(): bool
    {
        return $this->status === 'Present';
    }

    public function isAbsent(): bool
    {
        return $this->status === 'Absent';
    }

    public function isLate(): bool
    {
        return $this->status === 'Late';
    }

    public function isExcused(): bool
    {
        return $this->status === 'Excused';
    }

    // Attributes
    public function getStatusColorAttribute(): string
    {
        return match($this->status) {
            'Present' => 'green',
            'Late' => 'yellow',
            'Excused' => 'blue',
            'Absent' => 'red',
            default => 'gray',
        };
    }

    public function getStatusIconAttribute(): string
    {
        return match($this->status) {
            'Present' => 'check-circle',
            'Late' => 'clock',
            'Excused' => 'info-circle',
            'Absent' => 'x-circle',
            default => 'circle',
        };
    }
}