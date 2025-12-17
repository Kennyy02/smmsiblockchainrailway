<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class AcademicYear extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'year_name',
        'start_date',
        'end_date',
        'is_current',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'is_current' => 'boolean',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    // Boot method to ensure only one current academic year
    protected static function boot()
    {
        parent::boot();

        static::saving(function ($academicYear) {
            if ($academicYear->is_current) {
                // Set all other academic years to not current
                static::where('id', '!=', $academicYear->id)
                    ->update(['is_current' => false]);
            }
        });
    }

    // Scopes
    public function scopeCurrent($query)
    {
        return $query->where('is_current', true);
    }

    public function scopeActive($query)
    {
        return $query->where('end_date', '>=', now());
    }

    public function scopePast($query)
    {
        return $query->where('end_date', '<', now());
    }

    // Relationships
    public function semesters()
    {
        return $this->hasMany(Semester::class);
    }

    public function classes()
    {
        return $this->hasMany(Classes::class);
    }

    public function classSubjects()
    {
        return $this->hasMany(ClassSubject::class);
    }

    public function grades()
    {
        return $this->hasMany(Grade::class);
    }

    // Helper Methods
    public function isActive(): bool
    {
        return $this->end_date->isFuture() || $this->end_date->isToday();
    }

    public function isPast(): bool
    {
        return $this->end_date->isPast();
    }

    public function getCurrentSemester()
    {
        return $this->semesters()->where('is_current', true)->first();
    }

    public function getActiveSemesters()
    {
        return $this->semesters()->where('end_date', '>=', now())->get();
    }

    public function getDurationInDays(): int
    {
        return $this->start_date->diffInDays($this->end_date);
    }

    public function getProgressPercentage(): float
    {
        if ($this->start_date->isFuture()) return 0;
        if ($this->end_date->isPast()) return 100;

        $total = $this->getDurationInDays();
        $elapsed = $this->start_date->diffInDays(now());

        return round(($elapsed / $total) * 100, 2);
    }

    // Attributes
    public function getStatusAttribute(): string
    {
        if ($this->is_current) return 'current';
        if ($this->isActive()) return 'active';
        return 'past';
    }

    public function getFullNameAttribute(): string
    {
        return "Academic Year {$this->year_name}";
    }
}