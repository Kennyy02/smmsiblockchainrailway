<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class CourseMaterial extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'subject_id',
        'title',
        'description',
        'file_path',
        'file_mime_type',
        'file_size',
        'uploaded_by',
    ];

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'deleted_at' => 'datetime',
            'file_size' => 'integer',
        ];
    }

    // ========================================================================
    // SCOPES
    // ========================================================================

    public function scopeBySubject($query, int $subjectId)
    {
        return $query->where('subject_id', $subjectId);
    }

    public function scopeByFileType($query, string $extension)
    {
        return $query->where('file_path', 'like', "%.{$extension}");
    }

    public function scopeRecent($query, int $days = 7)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    public function scopeSearch($query, string $search)
    {
        return $query->where(function($q) use ($search) {
            $q->where('title', 'like', "%{$search}%")
              ->orWhere('description', 'like', "%{$search}%");
        });
    }

    // ========================================================================
    // RELATIONSHIPS
    // ========================================================================

    public function subject()
    {
        return $this->belongsTo(Subject::class);
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    // ========================================================================
    // HELPER METHODS
    // ========================================================================

    public function getFileExtension(): ?string
    {
        if (!$this->file_path) return null;
        return pathinfo($this->file_path, PATHINFO_EXTENSION);
    }

    public function getFileName(): string
    {
        if (!$this->file_path) return 'Unknown';
        return pathinfo($this->file_path, PATHINFO_BASENAME);
    }

    public function getFileSize(): ?int
    {
        // Use database field if present
        if ($this->file_size !== null) return $this->file_size;

        if (!$this->file_path) return null;
        
        $fullPath = storage_path('app/public/' . $this->file_path);
        if (file_exists($fullPath)) {
            return filesize($fullPath);
        }
        
        return null;
    }

    public function getFileSizeFormatted(): string
    {
        $bytes = $this->getFileSize();
        if (!$bytes) return 'N/A';

        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= (1 << (10 * $pow));

        return round($bytes, 2) . ' ' . $units[$pow];
    }

    public function fileExists(): bool
    {
        if (!$this->file_path) return false;
        return Storage::disk('public')->exists($this->file_path);
    }

    public function getDownloadUrl(): string
    {
        return route('course-materials.download', $this->id);
    }

    public function getFileUrl(): string
    {
        if (!$this->file_path) return '';
        return Storage::disk('public')->url($this->file_path);
    }

    public function deleteFile(): bool
    {
        if ($this->file_path && Storage::disk('public')->exists($this->file_path)) {
            return Storage::disk('public')->delete($this->file_path);
        }
        return false;
    }

    // ========================================================================
    // ATTRIBUTES (Accessors)
    // ========================================================================

    public function getFileTypeAttribute(): string
    {
        $extension = $this->getFileExtension();
        if (!$extension) return 'Unknown';
        
        return match(strtolower($extension)) {
            'pdf' => 'PDF Document',
            'doc', 'docx' => 'Word Document',
            'xls', 'xlsx' => 'Excel Spreadsheet',
            'ppt', 'pptx' => 'PowerPoint Presentation',
            'jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg' => 'Image',
            'mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv' => 'Video',
            'mp3', 'wav', 'ogg', 'flac' => 'Audio',
            'zip', 'rar', '7z', 'tar', 'gz' => 'Archive',
            'txt' => 'Text File',
            'csv' => 'CSV File',
            'html', 'htm' => 'HTML File',
            'css' => 'CSS File',
            'js' => 'JavaScript File',
            'json' => 'JSON File',
            'xml' => 'XML File',
            default => strtoupper($extension) . ' File',
        };
    }

    public function getFileIconAttribute(): string
    {
        $extension = $this->getFileExtension();
        if (!$extension) return 'file';
        
        return match(strtolower($extension)) {
            'pdf' => 'file-pdf',
            'doc', 'docx' => 'file-word',
            'xls', 'xlsx' => 'file-excel',
            'ppt', 'pptx' => 'file-powerpoint',
            'jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg' => 'file-image',
            'mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv' => 'file-video',
            'mp3', 'wav', 'ogg', 'flac' => 'file-audio',
            'zip', 'rar', '7z', 'tar', 'gz' => 'file-archive',
            'txt' => 'file-text',
            'csv' => 'file-csv',
            'html', 'htm', 'css', 'js' => 'file-code',
            default => 'file',
        };
    }

    public function getUploadedByNameAttribute(): ?string
    {
        return $this->uploader?->name ?? 'Unknown';
    }

    public function getSubjectNameAttribute(): string
    {
        return $this->subject?->subject_name ?? 'Unknown Subject';
    }

    public function getSubjectCodeAttribute(): string
    {
        return $this->subject?->subject_code ?? 'N/A';
    }

    // ========================================================================
    // BOOT METHOD
    // ========================================================================

    protected static function boot()
    {
        parent::boot();

        // Delete file when model is force deleted
        static::deleting(function ($material) {
            if ($material->isForceDeleting()) {
                $material->deleteFile();
            }
        });
    }
}
