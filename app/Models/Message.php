<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Message extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'sender_id',
        'receiver_id',
        'message',
        'is_read',
    ];

    protected function casts(): array
    {
        return [
            'is_read' => 'boolean',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    // Scopes
    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }

    public function scopeRead($query)
    {
        return $query->where('is_read', true);
    }

    public function scopeBySender($query, int $senderId)
    {
        return $query->where('sender_id', $senderId);
    }

    public function scopeByReceiver($query, int $receiverId)
    {
        return $query->where('receiver_id', $receiverId);
    }

    public function scopeBetweenUsers($query, int $user1Id, int $user2Id)
    {
        return $query->where(function($q) use ($user1Id, $user2Id) {
            $q->where('sender_id', $user1Id)->where('receiver_id', $user2Id);
        })->orWhere(function($q) use ($user1Id, $user2Id) {
            $q->where('sender_id', $user2Id)->where('receiver_id', $user1Id);
        });
    }

    public function scopeRecent($query, int $days = 7)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    // Relationships
    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function receiver()
    {
        return $this->belongsTo(User::class, 'receiver_id');
    }

    // Helper Methods
    public function markAsRead(): void
    {
        $this->is_read = true;
        $this->save();
    }

    public function markAsUnread(): void
    {
        $this->is_read = false;
        $this->save();
    }

    public function isUnread(): bool
    {
        return !$this->is_read;
    }

    public function isSentBy(int $userId): bool
    {
        return $this->sender_id === $userId;
    }

    public function isReceivedBy(int $userId): bool
    {
        return $this->receiver_id === $userId;
    }

    public function getOtherUser(int $userId): ?User
    {
        if ($this->sender_id === $userId) {
            return $this->receiver;
        } elseif ($this->receiver_id === $userId) {
            return $this->sender;
        }
        return null;
    }

    // Attributes
    public function getStatusAttribute(): string
    {
        return $this->is_read ? 'read' : 'unread';
    }

    public function getTimeAgoAttribute(): string
    {
        return $this->created_at->diffForHumans();
    }

    public function getPreviewAttribute(): string
    {
        return strlen($this->message) > 50 
            ? substr($this->message, 0, 50) . '...' 
            : $this->message;
    }

    public function getSenderNameAttribute(): string
    {
        return $this->sender?->name ?? 'Unknown';
    }

    public function getReceiverNameAttribute(): string
    {
        return $this->receiver?->name ?? 'Unknown';
    }
}