<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\SoftDeletes;

class User extends Authenticatable
{
    use HasFactory, Notifiable, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'email_verified_at',
        'role',
        'status',
        'avatar',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeInactive($query)
    {
        return $query->where('status', 'inactive');
    }

    public function scopeByRole($query, string $role)
    {
        return $query->where('role', $role);
    }

    public function scopeAdmins($query)
    {
        return $query->where('role', 'admin');
    }

    public function scopeTeachers($query)
    {
        return $query->where('role', 'teacher');
    }

    public function scopeStudents($query)
    {
        return $query->where('role', 'student');
    }

    public function scopeParents($query)
    {
        return $query->where('role', 'parent');
    }

    public function scopeSearch($query, string $search)
    {
        return $query->where(function($q) use ($search) {
            $q->where('name', 'like', "%{$search}%")
              ->orWhere('email', 'like', "%{$search}%");
        });
    }

    // Relationships
    public function teacher()
    {
        return $this->hasOne(Teacher::class);
    }

    public function student()
    {
        return $this->hasOne(Student::class);
    }

    public function parent()
    {
        return $this->hasOne(ParentModel::class);
    }

    public function sentMessages()
    {
        return $this->hasMany(Message::class, 'sender_id');
    }

    public function receivedMessages()
    {
        return $this->hasMany(Message::class, 'receiver_id');
    }

    public function createdAnnouncements()
    {
        return $this->hasMany(Announcement::class, 'created_by');
    }

    public function blockchainTransactions()
    {
        return $this->hasMany(BlockchainTransaction::class, 'initiated_by');
    }

    // Helper Methods
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isTeacher(): bool
    {
        return $this->role === 'teacher';
    }

    public function isStudent(): bool
    {
        return $this->role === 'student';
    }

    public function isParent(): bool
    {
        return $this->role === 'parent';
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function hasVerifiedEmail(): bool
    {
        return !is_null($this->email_verified_at);
    }

    public function getProfile()
    {
        return match($this->role) {
            'teacher' => $this->teacher,
            'student' => $this->student,
            'parent' => $this->parent,
            default => null,
        };
    }

    public function getUnreadMessagesCount(): int
    {
        return $this->receivedMessages()->where('is_read', false)->count();
    }

    public function getRecentMessages(int $limit = 10)
    {
        return $this->receivedMessages()
            ->with('sender')
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    public function getRecentAnnouncements(int $limit = 5)
    {
        return Announcement::published()
            ->where(function($q) {
                $q->where('target_audience', 'All')
                  ->orWhere('target_audience', ucfirst($this->role) . 's');
            })
            ->orderBy('published_at', 'desc')
            ->limit($limit)
            ->get();
    }

    // Attributes
    public function getAvatarUrlAttribute(): string
    {
        if ($this->avatar) {
            return asset('storage/' . $this->avatar);
        }
        
        // Default avatar based on role
        return asset("images/avatars/default-{$this->role}.png");
    }

    public function getRoleBadgeColorAttribute(): string
    {
        return match($this->role) {
            'admin' => 'red',
            'teacher' => 'blue',
            'student' => 'green',
            'parent' => 'purple',
            default => 'gray',
        };
    }

    public function getStatusBadgeColorAttribute(): string
    {
        return $this->status === 'active' ? 'green' : 'red';
    }

    public function getFullProfileAttribute(): array
    {
        $profile = [
            'user' => $this,
            'role_specific' => $this->getProfile(),
        ];

        if ($this->isStudent()) {
            $profile['grades'] = $this->student?->grades()->with('classSubject.subject')->get();
            $profile['gpa'] = $this->student?->getGPA();
            $profile['attendance_rate'] = $this->student?->getAttendanceRate();
        } elseif ($this->isTeacher()) {
            $profile['subjects'] = $this->teacher?->getCurrentSubjects();
            $profile['class_count'] = $this->teacher?->getClassCount();
        } elseif ($this->isParent()) {
            $profile['students'] = $this->parent?->students;
        }

        return $profile;
    }
}