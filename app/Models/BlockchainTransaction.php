<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BlockchainTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'transaction_hash',
        'transaction_type',
        'initiated_by',
        'status',
        'submitted_at',
    ];

    protected function casts(): array
    {
        return [
            'submitted_at' => 'datetime',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    // Scopes
    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeConfirmed($query)
    {
        return $query->where('status', 'confirmed');
    }

    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }

    public function scopeByType($query, string $type)
    {
        return $query->where('transaction_type', $type);
    }

    public function scopeByInitiator($query, int $userId)
    {
        return $query->where('initiated_by', $userId);
    }

    public function scopeRecent($query, int $days = 7)
    {
        return $query->where('submitted_at', '>=', now()->subDays($days));
    }

    public function scopeToday($query)
    {
        return $query->whereDate('submitted_at', today());
    }

    // Relationships
    public function initiator()
    {
        return $this->belongsTo(User::class, 'initiated_by');
    }

    public function certificate()
    {
        return $this->hasOne(Certificate::class, 'blockchain_tx_hash', 'transaction_hash');
    }

    /**
     * Find the attendance record associated with this transaction by matching the hash
     */
    public function getAttendanceAttribute()
    {
        if (!in_array($this->transaction_type, ['attendance_creation', 'attendance_update'])) {
            return null;
        }

        // Only check attendance records created within 1 hour of the transaction
        // This significantly reduces the search space
        $startTime = $this->submitted_at->copy()->subHour();
        $endTime = $this->submitted_at->copy()->addHour();
        
        $attendances = Attendance::with(['student', 'classSubject.subject'])
            ->whereBetween('created_at', [$startTime, $endTime])
            ->get();
        
        foreach ($attendances as $attendance) {
            try {
                if ($attendance->generateBlockchainHash() === $this->transaction_hash) {
                    return $attendance;
                }
            } catch (\Exception $e) {
                // Skip if hash generation fails
                continue;
            }
        }
        
        return null;
    }

    /**
     * Find the grade record associated with this transaction by matching the hash
     */
    public function getGradeAttribute()
    {
        if (!in_array($this->transaction_type, ['grade_creation', 'grade_update'])) {
            return null;
        }

        // Only check grade records created within 1 hour of the transaction
        // This significantly reduces the search space
        $startTime = $this->submitted_at->copy()->subHour();
        $endTime = $this->submitted_at->copy()->addHour();
        
        $grades = Grade::with(['student', 'classSubject.subject'])
            ->whereBetween('created_at', [$startTime, $endTime])
            ->get();
        
        foreach ($grades as $grade) {
            try {
                if ($grade->generateBlockchainHash() === $this->transaction_hash) {
                    return $grade;
                }
            } catch (\Exception $e) {
                // Skip if hash generation fails
                continue;
            }
        }
        
        return null;
    }

    // Helper Methods
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isConfirmed(): bool
    {
        return $this->status === 'confirmed';
    }

    public function isFailed(): bool
    {
        return $this->status === 'failed';
    }

    public function confirm(): void
    {
        $this->status = 'confirmed';
        $this->save();
    }

    public function fail(): void
    {
        $this->status = 'failed';
        $this->save();
    }

    public function retry(): void
    {
        $this->status = 'pending';
        $this->submitted_at = now();
        $this->save();
    }

    public static function generateHash(array $data): string
    {
        return hash('sha256', json_encode($data));
    }

    public function verifyHash(array $originalData): bool
    {
        $generatedHash = self::generateHash($originalData);
        return $this->transaction_hash === $generatedHash;
    }

    public function getProcessingTime(): ?int
    {
        if (!$this->isConfirmed() && !$this->isFailed()) {
            return null;
        }

        return $this->submitted_at->diffInSeconds($this->updated_at);
    }

    public function getAge(): int
    {
        return $this->submitted_at->diffInSeconds(now());
    }

    // Attributes
    public function getStatusBadgeColorAttribute(): string
    {
        return match($this->status) {
            'confirmed' => 'green',
            'pending' => 'yellow',
            'failed' => 'red',
            default => 'gray',
        };
    }

    public function getStatusLabelAttribute(): string
    {
        return ucfirst($this->status);
    }

    public function getShortHashAttribute(): string
    {
        return substr($this->transaction_hash, 0, 8) . '...' . substr($this->transaction_hash, -8);
    }

    public function getTypeDisplayAttribute(): string
    {
        return str_replace('_', ' ', ucwords($this->transaction_type, '_'));
    }

    public function getInitiatorNameAttribute(): string
    {
        return $this->initiator?->name ?? 'Unknown';
    }

    public function getTimeAgoAttribute(): string
    {
        return $this->submitted_at->diffForHumans();
    }

    public function getProcessingTimeFormattedAttribute(): ?string
    {
        $seconds = $this->getProcessingTime();
        
        if ($seconds === null) {
            return null;
        }

        if ($seconds < 60) {
            return $seconds . 's';
        } elseif ($seconds < 3600) {
            return round($seconds / 60, 1) . 'm';
        } else {
            return round($seconds / 3600, 1) . 'h';
        }
    }

    // Statistics Methods
    public static function getSuccessRate(int $days = 30): float
    {
        $total = static::where('submitted_at', '>=', now()->subDays($days))->count();
        
        if ($total === 0) return 0;

        $confirmed = static::confirmed()
            ->where('submitted_at', '>=', now()->subDays($days))
            ->count();

        return round(($confirmed / $total) * 100, 2);
    }

    public static function getAverageProcessingTime(int $days = 30): ?float
    {
        $transactions = static::confirmed()
            ->where('submitted_at', '>=', now()->subDays($days))
            ->get();

        if ($transactions->isEmpty()) return null;

        $totalTime = $transactions->sum(function($transaction) {
            return $transaction->getProcessingTime();
        });

        return round($totalTime / $transactions->count(), 2);
    }

    public static function getDailyTransactionCount(int $days = 7): array
    {
        $counts = [];
        
        for ($i = $days - 1; $i >= 0; $i--) {
            $date = now()->subDays($i)->format('Y-m-d');
            $count = static::whereDate('submitted_at', $date)->count();
            $counts[$date] = $count;
        }

        return $counts;
    }
}