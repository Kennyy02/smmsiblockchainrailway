<?php

namespace App\Traits;

use App\Services\AuditService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Request;

trait Auditable
{
    /**
     * Cache for old attributes to avoid database persistence issues
     * Keyed by object hash to handle multiple models
     */
    protected static $oldAttributesCache = [];

    /**
     * Boot the Auditable trait
     */
    protected static function bootAuditable()
    {
        $auditService = app(AuditService::class);

        // Log when model is created
        static::created(function (Model $model) use ($auditService) {
            $auditService->logCreate($model, request());
        });

        // Log when model is updated
        static::updating(function (Model $model) {
            // Store old values in a way that Laravel won't try to persist
            // Using a static array keyed by model instance hash to avoid database persistence
            static::$oldAttributesCache[spl_object_hash($model)] = $model->getOriginal();
        });

        static::updated(function (Model $model) use ($auditService) {
            $modelHash = spl_object_hash($model);
            if (isset(static::$oldAttributesCache[$modelHash])) {
                $oldValues = static::$oldAttributesCache[$modelHash];
                $newValues = $model->getAttributes();
                $auditService->logUpdate($model, $oldValues, $newValues, request());
                unset(static::$oldAttributesCache[$modelHash]);
            }
        });

        // Log when model is deleted
        static::deleted(function (Model $model) use ($auditService) {
            // For soft deletes, we need to check if it's actually being deleted
            if ($model->isForceDeleting()) {
                $auditService->logDelete($model, request());
            } else {
                // Soft delete - we'll log this as an update or special type
                $auditService->logDelete($model, request());
            }
        });

        // Log when model is restored (for soft deletes)
        static::restored(function (Model $model) use ($auditService) {
            // Log restoration as an update with special handling
            $oldValues = ['deleted_at' => $model->deleted_at];
            $newValues = array_merge($model->getAttributes(), ['deleted_at' => null]);
            $auditService->logUpdate($model, $oldValues, $newValues, request());
        });
    }

    /**
     * Relationship to audit logs
     */
    public function auditLogs()
    {
        return $this->morphMany(\App\Models\AuditLog::class, 'auditable');
    }

    /**
     * Get recent audit logs for this model
     */
    public function recentAuditLogs(int $limit = 10)
    {
        return $this->auditLogs()
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }
}

