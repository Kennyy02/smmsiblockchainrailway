<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class AuditLogController extends Controller
{
    /**
     * Get paginated list of audit logs
     * GET /api/audit-logs
     */
    public function index(Request $request)
    {
        try {
            $query = AuditLog::with(['user', 'auditable']);

            // Apply filters
            if ($auditType = $request->input('audit_type')) {
                $query->byAuditType($auditType);
            }

            if ($userId = $request->input('user_id')) {
                $query->byUser($userId);
            }

            if ($modelType = $request->input('model_type')) {
                $query->byModel($modelType);
            }

            if ($request->input('has_blockchain')) {
                $query->hasBlockchainHash();
            }

            if (($startDate = $request->input('start_date')) && ($endDate = $request->input('end_date'))) {
                $query->byDateRange($startDate, $endDate);
            }

            if ($request->input('recent')) {
                $days = $request->input('days', 7);
                $query->recent($days);
            }

            // Search
            if ($search = $request->input('search')) {
                $query->where(function($q) use ($search) {
                    $q->where('description', 'like', "%{$search}%")
                      ->orWhere('blockchain_hash', 'like', "%{$search}%")
                      ->orWhereHas('user', function($subQ) use ($search) {
                          $subQ->where('name', 'like', "%{$search}%")
                               ->orWhere('email', 'like', "%{$search}%");
                      });
                });
            }

            // Sorting
            $sortBy = $request->input('sort_by', 'created_at');
            $sortOrder = $request->input('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            // Pagination
            $perPage = $request->input('per_page', 15);
            $auditLogs = $query->paginate($perPage);

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'data' => $auditLogs->items(),
                    'pagination' => [
                        'current_page' => $auditLogs->currentPage(),
                        'last_page' => $auditLogs->lastPage(),
                        'per_page' => $auditLogs->perPage(),
                        'total' => $auditLogs->total()
                    ]
                ]);
            }

            return Inertia::render('Admin/AuditLogs', [
                'auditLogs' => $auditLogs,
                'filters' => $request->only(['audit_type', 'user_id', 'model_type', 'search', 'sort_by', 'sort_order'])
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching audit logs: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve audit logs',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a single audit log by ID
     * GET /api/audit-logs/{id}
     */
    public function show($id)
    {
        try {
            $auditLog = AuditLog::with(['user', 'auditable', 'blockchainTransaction'])
                ->findOrFail($id);

            // Verify integrity if blockchain hash exists
            $integrityVerified = $auditLog->blockchain_hash ? $auditLog->verifyIntegrity() : null;

            return response()->json([
                'success' => true,
                'data' => $auditLog,
                'integrity_verified' => $integrityVerified
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching audit log: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Audit log not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Get audit logs for a specific model
     * GET /api/audit-logs/model/{modelType}/{modelId}
     */
    public function getModelLogs($modelType, $modelId)
    {
        try {
            $auditLogs = AuditLog::where('auditable_type', $modelType)
                ->where('auditable_id', $modelId)
                ->with(['user', 'blockchainTransaction'])
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $auditLogs
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching model audit logs: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve audit logs',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get audit statistics
     * GET /api/audit-logs/stats
     */
    public function getStats()
    {
        try {
            $totalLogs = AuditLog::count();
            $todayLogs = AuditLog::today()->count();
            $recentLogs = AuditLog::recent(7)->count();

            $byType = AuditLog::selectRaw('audit_type, COUNT(*) as count')
                ->groupBy('audit_type')
                ->get()
                ->pluck('count', 'audit_type');

            $byModel = AuditLog::selectRaw('auditable_type, COUNT(*) as count')
                ->groupBy('auditable_type')
                ->orderBy('count', 'desc')
                ->limit(10)
                ->get()
                ->map(function($item) {
                    return [
                        'model' => class_basename($item->auditable_type),
                        'count' => $item->count
                    ];
                });

            $withBlockchain = AuditLog::hasBlockchainHash()->count();
            $withoutBlockchain = $totalLogs - $withBlockchain;

            return response()->json([
                'success' => true,
                'data' => [
                    'total_logs' => $totalLogs,
                    'today_logs' => $todayLogs,
                    'recent_logs' => $recentLogs,
                    'by_type' => $byType,
                    'by_model' => $byModel,
                    'with_blockchain' => $withBlockchain,
                    'without_blockchain' => $withoutBlockchain,
                    'blockchain_percentage' => $totalLogs > 0 ? round(($withBlockchain / $totalLogs) * 100, 2) : 0,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching audit log stats: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

