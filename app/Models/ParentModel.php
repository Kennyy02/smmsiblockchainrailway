<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ParentModel extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'parents';

    protected $fillable = [
        'user_id',
        'first_name',
        'middle_name',
        'last_name',
        'email',
        'phone',
        'address',
    ];
    
    protected $appends = ['full_name'];

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    // Scopes
    public function scopeSearch($query, string $search)
    {
        $studentTable = (new Student())->getTable();
        $courseTable = (new Course())->getTable();
        
        return $query->where(function($q) use ($search, $studentTable, $courseTable) {
            // Search in parent fields
            $q->where('first_name', 'like', "%{$search}%")
              ->orWhere('last_name', 'like', "%{$search}%")
              ->orWhere('email', 'like', "%{$search}%")
              ->orWhere('phone', 'like', "%{$search}%")
              // Search in child (student) names, student ID, and program
              ->orWhereHas('students', function($studentQuery) use ($search, $studentTable) {
                  $studentQuery->where(function($sq) use ($search, $studentTable) {
                      $sq->where("{$studentTable}.first_name", 'like', "%{$search}%")
                        ->orWhere("{$studentTable}.last_name", 'like', "%{$search}%")
                        ->orWhere("{$studentTable}.middle_name", 'like', "%{$search}%")
                        ->orWhere("{$studentTable}.student_id", 'like', "%{$search}%")
                        ->orWhere("{$studentTable}.program", 'like', "%{$search}%");
                  });
              })
              // Search in course name/code through students
              ->orWhereHas('students', function($studentQuery) use ($search, $courseTable) {
                  $studentQuery->whereHas('course', function($courseQuery) use ($search, $courseTable) {
                      $courseQuery->where(function($cq) use ($search, $courseTable) {
                          $cq->where("{$courseTable}.course_name", 'like', "%{$search}%")
                            ->orWhere("{$courseTable}.course_code", 'like', "%{$search}%");
                      });
                  });
              });
        });
    }

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function students()
    {
        return $this->belongsToMany(Student::class, 'parent_student', 'parent_id', 'student_id')
            ->withPivot('relationship')
            ->withTimestamps();
    }

    // Helper Methods
    public function getFullName(): string
    {
        $name = $this->first_name;
        if ($this->middle_name) {
            $name .= ' ' . substr($this->middle_name, 0, 1) . '.';
        }
        $name .= ' ' . $this->last_name;
        return $name;
    }

    public function getStudentCount(): int
    {
        return $this->students()->count();
    }

    public function getStudentGrades()
    {
        return Grade::whereIn('student_id', $this->students()->pluck('id'))
            ->with(['student', 'classSubject.subject'])
            ->get();
    }

    public function getStudentAttendance()
    {
        return Attendance::whereIn('student_id', $this->students()->pluck('id'))
            ->with(['student', 'classSubject.subject'])
            ->orderBy('attendance_date', 'desc')
            ->get();
    }

    // Attributes
    public function getFullNameAttribute(): string
    {
        return $this->getFullName();
    }
}