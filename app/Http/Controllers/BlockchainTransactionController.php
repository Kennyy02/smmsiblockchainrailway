<?php

namespace App\Http\Controllers;

use App\Models\BlockchainTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class BlockchainTransactionController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = BlockchainTransaction::with('initiator');
            
            if ($status = $request->input('status')) {
                $query->byStatus($status);
            }
            
            if ($type = $request->input('type')) {
                $query->byType($type);
            }
            
            if ($userId = $request->input('user_id')) {
                $query->byInitiator($userId);
            }
            
            if ($request->input('recent')) {
                $days = $request->input('days', 7);
                $query->recent($days);
            }
            
            $sortBy = $request->input('sort_by', 'submitted_at');
            $sortOrder = $request->input('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);
            
            if ($request->expectsJson()) {
                $perPage = $request->input('per_page', 15);
                $transactions = $query->paginate($perPage);
                
                // Load related data for each transaction
                $transactions->getCollection()->transform(function ($transaction) {
                    // Add attendance data if it's an attendance transaction
                    if (in_array($transaction->transaction_type, ['attendance_creation', 'attendance_update'])) {
                        $transaction->attendance = $transaction->attendance;
                    }
                    // Add grade data if it's a grade transaction
                    if (in_array($transaction->transaction_type, ['grade_creation', 'grade_update'])) {
                        $transaction->grade = $transaction->grade;
                    }
                    return $transaction;
                });
                
                return response()->json([
                    'success' => true,
                    'data' => $transactions->items(),
                    'pagination' => [
                        'current_page' => $transactions->currentPage(),
                        'last_page' => $transactions->lastPage(),
                        'per_page' => $transactions->perPage(),
                        'total' => $transactions->total()
                    ]
                ]);
            }
            
            $perPage = $request->input('per_page', 15);
            $transactions = $query->paginate($perPage);
            
            return Inertia::render('BlockchainTransactions/Index', [
                'transactions' => $transactions,
                'filters' => $request->only(['status', 'type', 'user_id', 'recent', 'days'])
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching blockchain transactions: ' . $e->getMessage());
            return $request->expectsJson()
                ? response()->json(['success' => false, 'message' => 'Failed to retrieve transactions'], 500)
                : back()->with('error', 'Failed to retrieve transactions');
        }
    }

    public function show(Request $request, $id)
    {
        try {
            $transaction = BlockchainTransaction::with(['initiator', 'certificate'])->findOrFail($id);
            
            if ($request->expectsJson()) {
                // Load related data
                if (in_array($transaction->transaction_type, ['attendance_creation', 'attendance_update'])) {
                    $transaction->attendance = $transaction->attendance;
                }
                if (in_array($transaction->transaction_type, ['grade_creation', 'grade_update'])) {
                    $transaction->grade = $transaction->grade;
                }
                
                return response()->json([
                    'success' => true,
                    'data' => [
                        'transaction' => $transaction,
                        'processing_time' => $transaction->getProcessingTime(),
                        'age' => $transaction->getAge(),
                    ]
                ]);
            }
            
            return Inertia::render('BlockchainTransactions/Show', ['transaction' => $transaction]);
        } catch (\Exception $e) {
            Log::error('Error fetching transaction: ' . $e->getMessage());
            return $request->expectsJson()
                ? response()->json(['success' => false, 'message' => 'Transaction not found'], 404)
                : back()->with('error', 'Transaction not found');
        }
    }

    public function confirm($id)
    {
        try {
            $transaction = BlockchainTransaction::findOrFail($id);
            $transaction->confirm();
            
            return response()->json([
                'success' => true,
                'data' => $transaction,
                'message' => 'Transaction confirmed successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error confirming transaction: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to confirm transaction'], 500);
        }
    }

    public function fail($id)
    {
        try {
            $transaction = BlockchainTransaction::findOrFail($id);
            $transaction->fail();
            
            return response()->json([
                'success' => true,
                'data' => $transaction,
                'message' => 'Transaction marked as failed'
            ]);
        } catch (\Exception $e) {
            Log::error('Error failing transaction: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to update transaction'], 500);
        }
    }

    public function retry($id)
    {
        try {
            $transaction = BlockchainTransaction::findOrFail($id);
            $transaction->retry();
            
            return response()->json([
                'success' => true,
                'data' => $transaction,
                'message' => 'Transaction retried successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error retrying transaction: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to retry transaction'], 500);
        }
    }

    public function getStats()
    {
        try {
            $successRate = BlockchainTransaction::getSuccessRate();
            $avgProcessingTime = BlockchainTransaction::getAverageProcessingTime();
            $dailyCounts = BlockchainTransaction::getDailyTransactionCount();
            
            $totalTransactions = BlockchainTransaction::count();
            $pendingCount = BlockchainTransaction::pending()->count();
            $confirmedCount = BlockchainTransaction::confirmed()->count();
            $failedCount = BlockchainTransaction::failed()->count();
            
            return response()->json([
                'success' => true,
                'data' => [
                    'total_transactions' => $totalTransactions,
                    'pending_count' => $pendingCount,
                    'confirmed_count' => $confirmedCount,
                    'failed_count' => $failedCount,
                    'success_rate' => $successRate,
                    'average_processing_time' => $avgProcessingTime,
                    'daily_counts' => $dailyCounts,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching transaction stats: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to retrieve stats'], 500);
        }
    }
}