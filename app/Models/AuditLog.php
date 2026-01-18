<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class AuditLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'audit_type',
        'auditable_type',
        'auditable_id',
        'user_id',
        'user_type',
        'ip_address',
        'user_agent',
        'url',
        'request_method',
        'old_values',
        'new_values',
        'changes',
        'description',
        'blockchain_hash',
        'blockchain_tx_id',
    ];

    protected function casts(): array
    {
        return [
            'old_values' => 'array',
            'new_values' => 'array',
            'changes' => 'array',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    // Relationships
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function auditable(): MorphTo
    {
        return $this->morphTo();
    }

    public function blockchainTransaction(): BelongsTo
    {
        return $this->belongsTo(BlockchainTransaction::class, 'blockchain_tx_id');
    }

    // Scopes
    public function scopeByAuditType($query, string $type)
    {
        return $query->where('audit_type', $type);
    }

    public function scopeByUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeByModel($query, string $modelType)
    {
        return $query->where('auditable_type', $modelType);
    }

    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('created_at', [$startDate, $endDate]);
    }

    public function scopeRecent($query, int $days = 7)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    public function scopeToday($query)
    {
        return $query->whereDate('created_at', today());
    }

    public function scopeHasBlockchainHash($query)
    {
        return $query->whereNotNull('blockchain_hash');
    }

    // Helper Methods
    public function generateBlockchainHash(): string
    {
        $data = [
            'audit_type' => $this->audit_type,
            'auditable_type' => $this->auditable_type,
            'auditable_id' => $this->auditable_id,
            'user_id' => $this->user_id,
            'old_values' => $this->old_values,
            'new_values' => $this->new_values,
            'changes' => $this->changes,
            'description' => $this->description,
            'created_at' => $this->created_at?->toIso8601String(),
            'timestamp' => now()->timestamp,
        ];

        ksort($data);
        return hash('sha256', json_encode($data, JSON_UNESCAPED_UNICODE));
    }

    public function verifyIntegrity(): bool
    {
        if (!$this->blockchain_hash) {
            return false;
        }

        $currentHash = $this->generateBlockchainHash();
        return hash_equals($this->blockchain_hash, $currentHash);
    }

    // Attributes
    public function getAuditTypeLabelAttribute(): string
    {
        return match($this->audit_type) {
            'created' => 'Created',
            'updated' => 'Updated',
            'deleted' => 'Deleted',
            'viewed' => 'Viewed',
            default => ucfirst($this->audit_type),
        };
    }

    public function getAuditTypeColorAttribute(): string
    {
        return match($this->audit_type) {
            'created' => 'green',
            'updated' => 'blue',
            'deleted' => 'red',
            'viewed' => 'gray',
            default => 'gray',
        };
    }

    public function getModelDisplayNameAttribute(): string
    {
        return class_basename($this->auditable_type);
    }

    public function getShortHashAttribute(): string
    {
        if (!$this->blockchain_hash) {
            return 'N/A';
        }
        return substr($this->blockchain_hash, 0, 8) . '...' . substr($this->blockchain_hash, -8);
    }
}

