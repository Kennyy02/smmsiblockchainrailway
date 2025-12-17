<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

// ==========================================
// Certificate Verification Model
// ==========================================
class CertificateVerification extends Model
{
    use HasFactory;

    protected $fillable = [
        'certificate_id',
        'verified_by_name',
        'verified_at',
    ];

    protected function casts(): array
    {
        return [
            'verified_at' => 'datetime',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function certificate()
    {
        return $this->belongsTo(Certificate::class);
    }
}
