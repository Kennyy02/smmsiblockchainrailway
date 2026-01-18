<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\Auditable;

class Attendance extends Model
{
    use HasFactory, SoftDeletes, Auditable;

    // Specify the table name (migration creates 'attendance' not 'attendances')
    protected $table = 'attendance';

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

    // ========================================================================
    // BLOCKCHAIN METHODS
    // ========================================================================

    /**
     * Generate a blockchain hash for this attendance record
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

        // Create a data structure that uniquely identifies this attendance
        $data = [
            'attendance_id' => $this->id,
            'student_id' => $this->student_id,
            'student_name' => $this->student ? ($this->student->first_name . ' ' . $this->student->last_name) : null,
            'class_subject_id' => $this->class_subject_id,
            'subject_code' => $this->classSubject?->subject?->subject_code,
            'subject_name' => $this->classSubject?->subject?->subject_name,
            'attendance_date' => $this->attendance_date ? $this->attendance_date->format('Y-m-d') : null,
            'status' => $this->status,
            'created_at' => $this->created_at ? $this->created_at->toIso8601String() : null,
            'updated_at' => $this->updated_at ? $this->updated_at->toIso8601String() : null,
            'timestamp' => now()->timestamp,
        ];

        // Sort data to ensure consistent hashing
        ksort($data);
        return hash('sha256', json_encode($data, JSON_UNESCAPED_UNICODE));
    }

    /**
     * Verify the integrity of the attendance by regenerating and comparing the hash
     */
    public function verifyIntegrity(string $storedHash): bool
    {
        $currentHash = $this->generateBlockchainHash();
        return hash_equals($storedHash, $currentHash);
    }

    /**
     * Register this attendance on the blockchain
     * Creates a blockchain transaction record for audit purposes
     */
    public function registerOnBlockchain(bool $isUpdate = false): void
    {
        // Generate the attendance hash
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
                    'transaction_type' => $isUpdate ? 'attendance_update' : 'attendance_creation',
                    'initiated_by' => $initiatedBy,
                    'status' => 'confirmed', // Attendance records are immediately confirmed as they're stored in our system
                    'submitted_at' => now(),
                ]);
            } catch (\Exception $e) {
                // Log but don't fail - attendance is already saved
                \Log::warning('Failed to create blockchain transaction for attendance: ' . $e->getMessage(), [
                    'attendance_id' => $this->id,
                    'error' => $e->getMessage()
                ]);
            }
        }
    }
}