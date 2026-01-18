<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\BlockchainTransaction;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class AuditService
{
    /**
     * Log a creation event
     */
    public function logCreate(Model $model, ?Request $request = null): ?AuditLog
    {
        return $this->log('created', $model, null, $model->getAttributes(), $request);
    }

    /**
     * Log an update event
     */
    public function logUpdate(Model $model, array $oldValues, array $newValues, ?Request $request = null): ?AuditLog
    {
        $changes = $this->calculateChanges($oldValues, $newValues);
        return $this->log('updated', $model, $oldValues, $newValues, $request, $changes);
    }

    /**
     * Log a deletion event
     */
    public function logDelete(Model $model, ?Request $request = null): ?AuditLog
    {
        return $this->log('deleted', $model, $model->getAttributes(), null, $request);
    }

    /**
     * Log a view/access event (optional)
     */
    public function logView(Model $model, ?Request $request = null): ?AuditLog
    {
        return $this->log('viewed', $model, null, null, $request);
    }

    /**
     * Core logging method
     */
    protected function log(
        string $auditType,
        Model $model,
        ?array $oldValues,
        ?array $newValues,
        ?Request $request = null,
        ?array $changes = null
    ): ?AuditLog {
        try {
            $user = Auth::user();
            
            // Get user context
            $userId = $user?->id;
            $userType = $user?->role ?? null;

            // Get request context
            $ipAddress = $request?->ip() ?? request()->ip();
            $userAgent = $request?->userAgent() ?? request()->userAgent();
            $url = $request?->fullUrl() ?? request()->fullUrl();
            $requestMethod = $request?->method() ?? request()->method();

            // Generate description
            $description = $this->generateDescription($auditType, $model, $oldValues, $newValues, $changes);

            // Create audit log
            $auditLog = AuditLog::create([
                'audit_type' => $auditType,
                'auditable_type' => get_class($model),
                'auditable_id' => $model->id ?? 0, // 0 for soft deletes
                'user_id' => $userId,
                'user_type' => $userType,
                'ip_address' => $ipAddress,
                'user_agent' => $userAgent,
                'url' => $url,
                'request_method' => $requestMethod,
                'old_values' => $oldValues,
                'new_values' => $newValues,
                'changes' => $changes,
                'description' => $description,
            ]);

            // Generate blockchain hash
            $blockchainHash = $auditLog->generateBlockchainHash();
            $auditLog->update(['blockchain_hash' => $blockchainHash]);

            // Create blockchain transaction record
            if ($userId) {
                try {
                    $blockchainTx = BlockchainTransaction::create([
                        'transaction_hash' => $blockchainHash,
                        'transaction_type' => "audit_{$auditType}",
                        'initiated_by' => $userId,
                        'status' => 'confirmed',
                        'submitted_at' => now(),
                    ]);

                    $auditLog->update(['blockchain_tx_id' => $blockchainTx->id]);
                } catch (\Exception $e) {
                    Log::warning('Failed to create blockchain transaction for audit log: ' . $e->getMessage(), [
                        'audit_log_id' => $auditLog->id,
                        'error' => $e->getMessage()
                    ]);
                }
            }

            return $auditLog;
        } catch (\Exception $e) {
            Log::error('Failed to create audit log: ' . $e->getMessage(), [
                'audit_type' => $auditType,
                'model' => get_class($model),
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Calculate changes between old and new values
     */
    protected function calculateChanges(array $oldValues, array $newValues): array
    {
        $changes = [];

        foreach ($newValues as $key => $newValue) {
            $oldValue = $oldValues[$key] ?? null;
            
            if ($oldValue !== $newValue) {
                $changes[$key] = [
                    'old' => $oldValue,
                    'new' => $newValue,
                ];
            }
        }

        // Check for deleted keys
        foreach ($oldValues as $key => $oldValue) {
            if (!array_key_exists($key, $newValues)) {
                $changes[$key] = [
                    'old' => $oldValue,
                    'new' => null,
                ];
            }
        }

        return $changes;
    }

    /**
     * Generate human-readable description
     */
    protected function generateDescription(
        string $auditType,
        Model $model,
        ?array $oldValues,
        ?array $newValues,
        ?array $changes
    ): string {
        $modelName = class_basename($model);
        $user = Auth::user();

        switch ($auditType) {
            case 'created':
                $name = $this->getModelName($model);
                return "{$modelName} '{$name}' was created" . ($user ? " by {$user->name}" : '');
            
            case 'updated':
                $name = $this->getModelName($model);
                $changeCount = $changes ? count($changes) : 0;
                $changedFields = $changes ? array_keys($changes) : [];
                
                if ($changeCount === 0) {
                    return "{$modelName} '{$name}' was updated" . ($user ? " by {$user->name}" : '');
                }
                
                $fieldsList = implode(', ', array_slice($changedFields, 0, 3));
                if ($changeCount > 3) {
                    $fieldsList .= " and " . ($changeCount - 3) . " more";
                }
                
                return "{$modelName} '{$name}' was updated: {$fieldsList}" . ($user ? " by {$user->name}" : '');
            
            case 'deleted':
                $name = $this->getModelName($model);
                return "{$modelName} '{$name}' was deleted" . ($user ? " by {$user->name}" : '');
            
            case 'viewed':
                $name = $this->getModelName($model);
                return "{$modelName} '{$name}' was viewed" . ($user ? " by {$user->name}" : '');
            
            default:
                return "{$modelName} was {$auditType}";
        }
    }

    /**
     * Get a human-readable name for the model
     */
    protected function getModelName(Model $model): string
    {
        // Try common name fields
        if ($model->getAttribute('name')) {
            return $model->name;
        }
        
        if ($model->getAttribute('title')) {
            return $model->title;
        }
        
        if ($model->getAttribute('first_name') && $model->getAttribute('last_name')) {
            return $model->first_name . ' ' . $model->last_name;
        }
        
        if ($model->getAttribute('email')) {
            return $model->email;
        }
        
        if ($model->getAttribute('student_id')) {
            return $model->student_id;
        }
        
        // Fallback to ID
        return "#{$model->id}";
    }
}

