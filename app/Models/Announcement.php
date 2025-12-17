<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Announcement extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'created_by',
        'title',
        'content',
        'target_audience',
        'published_at',
    ];

    protected function casts(): array
    {
        return [
            'published_at' => 'datetime',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    // Scopes
    public function scopePublished($query)
    {
        return $query->whereNotNull('published_at')
            ->where('published_at', '<=', now());
    }

    public function scopeUnpublished($query)
    {
        return $query->whereNull('published_at')
            ->orWhere('published_at', '>', now());
    }

    public function scopeDraft($query)
    {
        return $query->whereNull('published_at');
    }

    public function scopeScheduled($query)
    {
        return $query->whereNotNull('published_at')
            ->where('published_at', '>', now());
    }

    public function scopeByAudience($query, string $audience)
    {
        return $query->where(function($q) use ($audience) {
            $q->where('target_audience', $audience)
              ->orWhere('target_audience', 'All');
        });
    }

    public function scopeForUser($query, User $user)
    {
        return $query->where(function($q) use ($user) {
            $q->where('target_audience', 'All')
              ->orWhere('target_audience', ucfirst($user->role) . 's');
        });
    }

    public function scopeRecent($query, int $days = 7)
    {
        return $query->where('published_at', '>=', now()->subDays($days));
    }

    public function scopeToday($query)
    {
        return $query->whereDate('published_at', today());
    }

    public function scopeSearch($query, string $search)
    {
        return $query->where(function($q) use ($search) {
            $q->where('title', 'like', "%{$search}%")
              ->orWhere('content', 'like', "%{$search}%");
        });
    }

    // Relationships
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // Helper Methods
    public function isPublished(): bool
    {
        return $this->published_at && $this->published_at->isPast();
    }

    public function isDraft(): bool
    {
        return is_null($this->published_at);
    }

    public function isScheduled(): bool
    {
        return $this->published_at && $this->published_at->isFuture();
    }

    public function publish(): void
    {
        $this->published_at = now();
        $this->save();
    }

    public function unpublish(): void
    {
        $this->published_at = null;
        $this->save();
    }

    public function scheduleFor(\DateTime $dateTime): void
    {
        $this->published_at = $dateTime;
        $this->save();
    }

    public function isVisibleTo(User $user): bool
    {
        if (!$this->isPublished()) return false;

        if ($this->target_audience === 'All') return true;

        $userAudience = ucfirst($user->role) . 's';
        return $this->target_audience === $userAudience;
    }

    public function getExpectedReachCount(): int
    {
        return match($this->target_audience) {
            'All' => User::active()->count(),
            'Teachers' => User::teachers()->active()->count(),
            'Students' => User::students()->active()->count(),
            'Parents' => User::parents()->active()->count(),
            default => 0,
        };
    }

    // Attributes
    public function getStatusAttribute(): string
    {
        if ($this->isDraft()) return 'draft';
        if ($this->isScheduled()) return 'scheduled';
        if ($this->isPublished()) return 'published';
        return 'unknown';
    }

    public function getStatusBadgeColorAttribute(): string
    {
        return match($this->status) {
            'published' => 'green',
            'scheduled' => 'blue',
            'draft' => 'yellow',
            default => 'gray',
        };
    }

    public function getStatusLabelAttribute(): string
    {
        return ucfirst($this->status);
    }

    public function getPublishedAtFormattedAttribute(): string
    {
        if (!$this->published_at) return 'Not published';
        return $this->published_at->format('M d, Y h:i A');
    }

    public function getTimeAgoAttribute(): ?string
    {
        if (!$this->published_at) return null;
        return $this->published_at->diffForHumans();
    }

    public function getCreatorNameAttribute(): string
    {
        return $this->creator?->name ?? 'Unknown';
    }

    public function getPreviewAttribute(): string
    {
        $preview = strip_tags($this->content);
        return strlen($preview) > 150 
            ? substr($preview, 0, 150) . '...' 
            : $preview;
    }

    public function getWordCountAttribute(): int
    {
        return str_word_count(strip_tags($this->content));
    }

    public function getReadingTimeAttribute(): int
    {
        // Average reading speed: 200 words per minute
        $words = $this->word_count;
        return max(1, ceil($words / 200));
    }

    public function getAudienceBadgeColorAttribute(): string
    {
        return match($this->target_audience) {
            'All' => 'purple',
            'Teachers' => 'blue',
            'Students' => 'green',
            'Parents' => 'orange',
            default => 'gray',
        };
    }

    // Static Methods
    public static function getPublishedForUser(User $user, int $limit = 10)
    {
        return static::published()
            ->forUser($user)
            ->orderBy('published_at', 'desc')
            ->limit($limit)
            ->get();
    }

    public static function getRecentAnnouncements(int $days = 7, ?string $audience = null)
    {
        $query = static::published()->recent($days);
        
        if ($audience) {
            $query->byAudience($audience);
        }
        
        return $query->orderBy('published_at', 'desc')->get();
    }

    public static function getTodayCount(): int
    {
        return static::published()->today()->count();
    }

    public static function getPendingCount(): int
    {
        return static::scheduled()->count();
    }

    public static function getDraftCount(): int
    {
        return static::draft()->count();
    }
}