<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Teacher extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'teacher_id',
        'first_name',
        'middle_name',
        'last_name',
        'email',
        'phone',
        'address',
        'department',
    ];

    // FIX: Add 'full_name' to the appends array
    // Temporarily disabled to debug 500 errors
    protected $appends = [
        // 'full_name', 
        // 'name_with_title'
    ];

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    // Scopes
    public function scopeByDepartment($query, string $department)
    {
        return $query->where('department', $department);
    }

    public function scopeSearch($query, string $search)
    {
        return $query->where(function($q) use ($search) {
            $q->where('teacher_id', 'like', "%{$search}%")
              ->orWhere('first_name', 'like', "%{$search}%")
              ->orWhere('last_name', 'like', "%{$search}%")
              ->orWhere('email', 'like', "%{$search}%");
        });
    }

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function classSubjects()
    {
        return $this->hasMany(ClassSubject::class);
    }

    /**
     * Get the class where this teacher is the adviser
     */
    public function advisoryClass()
    {
        return $this->hasOne(Classes::class, 'adviser_id');
    }

    /**
     * Get subjects assigned to this teacher (legacy - one-to-many)
     */
    public function subjects()
    {
        return $this->hasMany(Subject::class);
    }

    /**
     * Get all subjects assigned to this teacher (many-to-many)
     */
    public function assignedSubjects()
    {
        return $this->belongsToMany(Subject::class, 'subject_teacher')
            ->withTimestamps();
    }

    public function issuedCertificates()
    {
        return $this->hasMany(Certificate::class, 'issued_by');
    }

    // FIX: Define the accessor method (used when appended)
    public function getFullNameAttribute(): string
    {
        $name = $this->first_name;
        if ($this->middle_name) {
            $name .= ' ' . substr($this->middle_name, 0, 1) . '.';
        }
        $name .= ' ' . $this->last_name;
        return $name;
    }

    // Helper Methods (Reusing the Accessor logic)
    public function getFullName(): string
    {
        return $this->getFullNameAttribute();
    }

    public function getClassCount(): int
    {
        return $this->classSubjects()->count();
    }

    public function getStudentCount(): int
    {
        // Requires Student model to be defined
        $classIds = $this->classSubjects()
            ->with('class')
            ->get()
            ->pluck('class.id')
            ->unique();
        
        // Assuming Student::class is accessible and defined
        // return Student::whereIn('current_class_id', $classIds)->count();
        return 0; // Placeholder for actual Student model logic
    }

    public function getCurrentSubjects()
    {
        return $this->classSubjects()
            ->whereHas('academicYear', function($q) {
                $q->where('is_current', true);
            })
            ->whereHas('semester', function($q) {
                $q->where('is_current', true);
            })
            ->with(['subject', 'class'])
            ->get();
    }

    public function getClasses()
    {
        // Requires Classes model to be defined
        // return Classes::whereIn('id', $this->classSubjects()->pluck('class_id'))->get();
        return collect(); // Placeholder for actual Classes model logic
    }

    // Attributes
    public function getNameWithTitleAttribute(): string
    {
        return "Prof. {$this->getFullNameAttribute()}";
    }
}