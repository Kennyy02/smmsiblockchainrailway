<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Certificate extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'certificate_number',
        'student_id',
        'issued_by',
        'certificate_type',
        'title',
        'date_issued',
        'blockchain_hash',
        'blockchain_timestamp',
        'blockchain_tx_hash',
    ];

    // Fields that should be excluded from mass assignment during creation
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'date_issued' => 'date',
            'blockchain_timestamp' => 'datetime',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    // Boot method to generate certificate number
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($certificate) {
            if (empty($certificate->certificate_number)) {
                $certificate->certificate_number = static::generateCertificateNumber();
            }
        });
    }

    // Scopes
    public function scopeByStudent($query, int $studentId)
    {
        return $query->where('student_id', $studentId);
    }

    public function scopeByType($query, string $type)
    {
        return $query->where('certificate_type', $type);
    }

    public function scopeVerified($query)
    {
        return $query->whereNotNull('blockchain_hash');
    }

    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('date_issued', [$startDate, $endDate]);
    }

    // Relationships
    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function issuer()
    {
        return $this->belongsTo(Teacher::class, 'issued_by');
    }

    public function verifications()
    {
        return $this->hasMany(CertificateVerification::class);
    }

    public function blockchainTransaction()
    {
        return $this->hasOne(BlockchainTransaction::class, 'transaction_hash', 'blockchain_tx_hash');
    }

    // Helper Methods
    public static function generateCertificateNumber(): string
    {
        $year = date('Y');
        $maxAttempts = 10;
        $attempt = 0;
        
        do {
            $random = strtoupper(substr(md5(uniqid(mt_rand(), true) . microtime(true)), 0, 8));
            $certificateNumber = "CERT-{$year}-{$random}";
            $attempt++;
            
            // Check if this certificate number already exists
            $exists = static::where('certificate_number', $certificateNumber)->exists();
            
            if (!$exists) {
                return $certificateNumber;
            }
        } while ($attempt < $maxAttempts);
        
        // If we still have duplicates after max attempts, add timestamp
        return "CERT-{$year}-" . strtoupper(substr(md5(uniqid(mt_rand(), true) . microtime(true) . rand()), 0, 8));
    }

    public function isVerified(): bool
    {
        return !empty($this->blockchain_hash);
    }

    public function getVerificationCount(): int
    {
        return $this->verifications()->count();
    }

    public function verify(string $verifiedByName = null): void
    {
        $this->verifications()->create([
            'verified_by_name' => $verifiedByName,
            'verified_at' => now(),
        ]);
    }

    public function generateBlockchainHash(): string
    {
        $data = [
            'certificate_number' => $this->certificate_number,
            'student_id' => $this->student_id,
            'title' => $this->title,
            'date_issued' => $this->date_issued->format('Y-m-d'),
        ];

        // Sort data to ensure consistent hashing
        ksort($data);
        return hash('sha256', json_encode($data, JSON_UNESCAPED_UNICODE));
    }

    /**
     * Verify the integrity of the certificate by regenerating and comparing the hash
     */
    public function verifyIntegrity(): bool
    {
        if (!$this->blockchain_hash) {
            return false; // Not registered on blockchain yet
        }

        // Regenerate hash with current data
        $currentHash = $this->generateBlockchainHash();
        
        // Compare with stored hash
        return hash_equals($this->blockchain_hash, $currentHash);
    }

    public function registerOnBlockchain(): void
    {
        // Ensure issuer relationship is loaded
        if (!$this->relationLoaded('issuer')) {
            $this->load('issuer');
        }

        // Generate the certificate hash
        $this->blockchain_hash = $this->generateBlockchainHash();
        $this->blockchain_timestamp = now();
        
        // Try to register on real blockchain if enabled
        $blockchainService = app(\App\Services\BlockchainService::class);
        $blockchainResult = null;
        
        if (config('blockchain.enabled', false) && $blockchainService->isConfigured()) {
            try {
                $blockchainResult = $blockchainService->registerCertificate(
                    $this->certificate_number,
                    $this->blockchain_hash
                );
                
                if ($blockchainResult['success'] && isset($blockchainResult['tx_hash'])) {
                    $this->blockchain_tx_hash = $blockchainResult['tx_hash'];
                }
            } catch (\Exception $e) {
                \Log::warning('Blockchain registration failed: ' . $e->getMessage());
            }
        }
        
        $this->save();

        // Get the user ID for initiated_by
        // Try to get from authenticated user first
        $initiatedBy = auth()->id();
        
        // If no authenticated user, try to get from teacher's user_id
        if (!$initiatedBy && $this->issuer) {
            // Reload issuer to ensure we have the latest data
            $this->issuer->refresh();
            if ($this->issuer->user_id) {
                $initiatedBy = $this->issuer->user_id;
            }
        }
        
        // If still no user ID, get the first admin user as fallback
        if (!$initiatedBy) {
            $adminUser = \App\Models\User::where('role', 'admin')->first();
            if ($adminUser) {
                $initiatedBy = $adminUser->id;
            }
        }

        // Create blockchain transaction record
        // Use blockchain_tx_hash if available, otherwise use blockchain_hash
        $txHash = $this->blockchain_tx_hash ?? $this->blockchain_hash;
        
        if ($initiatedBy) {
            try {
                BlockchainTransaction::updateOrCreate(
                    [
                        'transaction_hash' => $txHash,
                    ],
                    [
                        'transaction_type' => 'certificate_creation',
                        'initiated_by' => $initiatedBy,
                        'status' => $blockchainResult && $blockchainResult['success'] ? 'confirmed' : 'pending',
                        'submitted_at' => now(),
                    ]
                );
            } catch (\Exception $e) {
                // Log but don't fail - certificate is already registered
                \Log::warning('Failed to create blockchain transaction: ' . $e->getMessage());
            }
        }
    }

    // Attributes
    public function getStatusAttribute(): string
    {
        return $this->isVerified() ? 'verified' : 'pending';
    }

    public function getQrCodeDataAttribute(): array
    {
        return [
            'certificate_number' => $this->certificate_number,
            'student_name' => $this->student->full_name,
            'title' => $this->title,
            'date_issued' => $this->date_issued->format('Y-m-d'),
            'blockchain_hash' => $this->blockchain_hash,
            'verification_url' => url("/certificates/verify/{$this->certificate_number}"),
        ];
    }
}