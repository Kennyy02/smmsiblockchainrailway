<?php

namespace App\Http\Controllers;

use App\Models\BlockchainTransaction;
use App\Models\Certificate;
use App\Models\CertificateVerification;
use App\Models\Student;
use App\Models\Teacher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class BlockchainController extends Controller
{
    // ========================================================================
    // 📊 STATISTICS
    // ========================================================================

    /**
     * Get combined blockchain and certificate statistics
     * GET /api/blockchain/stats
     */
    public function getStats()
    {
        try {
            // Transaction stats
            $totalTransactions = BlockchainTransaction::count();
            $pendingCount = BlockchainTransaction::pending()->count();
            $confirmedCount = BlockchainTransaction::confirmed()->count();
            $failedCount = BlockchainTransaction::failed()->count();
            $successRate = BlockchainTransaction::getSuccessRate();
            $avgProcessingTime = BlockchainTransaction::getAverageProcessingTime();

            // Certificate stats
            $totalCertificates = Certificate::count();
            $verifiedCertificates = Certificate::verified()->count();
            $pendingCertificates = $totalCertificates - $verifiedCertificates;

            return response()->json([
                'success' => true,
                'data' => [
                    // Transaction stats
                    'total_transactions' => $totalTransactions,
                    'pending_count' => $pendingCount,
                    'confirmed_count' => $confirmedCount,
                    'failed_count' => $failedCount,
                    'success_rate' => $successRate,
                    'average_processing_time' => $avgProcessingTime,
                    
                    // Certificate stats
                    'total_certificates' => $totalCertificates,
                    'verified_certificates' => $verifiedCertificates,
                    'pending_certificates' => $pendingCertificates,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching blockchain stats: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve blockchain statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ========================================================================
    // 🔗 BLOCKCHAIN TRANSACTIONS
    // ========================================================================

    /**
     * Get paginated list of blockchain transactions
     * GET /api/blockchain/transactions
     */
    public function getTransactions(Request $request)
    {
        try {
            $query = BlockchainTransaction::with('initiator');
            
            // Apply filters
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
            
            // Search
            if ($search = $request->input('search')) {
                $query->where(function($q) use ($search) {
                    $q->where('transaction_hash', 'like', "%{$search}%")
                      ->orWhere('transaction_type', 'like', "%{$search}%")
                      ->orWhereHas('initiator', function($subQ) use ($search) {
                          $subQ->where('name', 'like', "%{$search}%")
                               ->orWhere('email', 'like', "%{$search}%");
                      });
                });
            }
            
            // Sorting
            $sortBy = $request->input('sort_by', 'submitted_at');
            $sortOrder = $request->input('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);
            
            // Pagination
            $perPage = $request->input('per_page', 15);
            $transactions = $query->paginate($perPage);
            
            // Add computed properties to each transaction
            $transactions->getCollection()->transform(function ($transaction) {
                $transaction->processing_time_seconds = $transaction->getProcessingTime();
                $transaction->processing_time_human = $transaction->processing_time_formatted;
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
        } catch (\Exception $e) {
            Log::error('Error fetching blockchain transactions: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve transactions',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a single transaction by ID
     * GET /api/blockchain/transactions/{id}
     */
    public function getTransaction($id)
    {
        try {
            $transaction = BlockchainTransaction::with(['initiator', 'certificate'])
                ->findOrFail($id);
            
            $transaction->processing_time_seconds = $transaction->getProcessingTime();
            $transaction->processing_time_human = $transaction->processing_time_formatted;
            
            return response()->json([
                'success' => true,
                'data' => $transaction
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching transaction: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Transaction not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Retry a failed transaction
     * POST /api/blockchain/transactions/{id}/retry
     */
    public function retryTransaction($id)
    {
        try {
            $transaction = BlockchainTransaction::findOrFail($id);
            $transaction->retry();
            
            return response()->json([
                'success' => true,
                'data' => $transaction,
                'message' => 'Transaction retry initiated successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error retrying transaction: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retry transaction',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a transaction record
     * DELETE /api/blockchain/transactions/{id}
     */
    public function deleteTransaction($id)
    {
        try {
            $transaction = BlockchainTransaction::findOrFail($id);
            $transaction->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Transaction record deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error deleting transaction: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete transaction',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ========================================================================
    // 📜 CERTIFICATES
    // ========================================================================

    /**
     * Get paginated list of certificates
     * GET /api/blockchain/certificates
     */
    public function getCertificates(Request $request)
    {
        try {
            $query = Certificate::with(['student.user', 'issuer.user']);
            
            // Apply filters
            if ($studentId = $request->input('student_id')) {
                $query->byStudent($studentId);
            }
            
            if ($type = $request->input('type')) {
                $query->byType($type);
            }
            
            if (($startDate = $request->input('start_date')) && ($endDate = $request->input('end_date'))) {
                $query->byDateRange($startDate, $endDate);
            }
            
            // Search
            if ($search = $request->input('search')) {
                $query->where(function($q) use ($search) {
                    $q->where('certificate_number', 'like', "%{$search}%")
                      ->orWhere('title', 'like', "%{$search}%")
                      ->orWhereHas('student', function($subQ) use ($search) {
                          $subQ->where('first_name', 'like', "%{$search}%")
                               ->orWhere('last_name', 'like', "%{$search}%")
                               ->orWhere('student_id', 'like', "%{$search}%");
                      });
                });
            }
            
            // Sorting
            $sortBy = $request->input('sort_by', 'date_issued');
            $sortOrder = $request->input('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);
            
            // Pagination
            $perPage = $request->input('per_page', 15);
            $certificates = $query->paginate($perPage);
            
            return response()->json([
                'success' => true,
                'data' => $certificates->items(),
                'pagination' => [
                    'current_page' => $certificates->currentPage(),
                    'last_page' => $certificates->lastPage(),
                    'per_page' => $certificates->perPage(),
                    'total' => $certificates->total()
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching certificates: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve certificates',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a single certificate by ID
     * GET /api/blockchain/certificates/{id}
     */
    public function getCertificate($id)
    {
        try {
            $certificate = Certificate::with(['student.user', 'issuer.user', 'blockchainTransaction'])
                ->findOrFail($id);
            
            return response()->json([
                'success' => true,
                'data' => $certificate
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching certificate: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Certificate not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Create a new certificate
     * POST /api/blockchain/certificates
     */
    public function createCertificate(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'student_id' => 'required|exists:students,id',
                'issued_by' => 'required|exists:teachers,id',
                'certificate_type' => 'required|in:Completion,Achievement,Maritime Certificate',
                'title' => 'required|string|max:255',
                'date_issued' => 'required|date',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            try {
                // Create certificate first (without blockchain registration)
                // Don't include blockchain_hash and blockchain_timestamp - they will be null by default
                $certificateData = $validator->validated();
                // Remove blockchain fields from the data - they should not be set during creation
                unset($certificateData['blockchain_hash']);
                unset($certificateData['blockchain_timestamp']);
                
                $certificate = Certificate::create($certificateData);
                
                // Load relationships
                $certificate->load(['student', 'issuer']);
                
                // Try to register on blockchain (creates a transaction record)
                // If this fails, we still want to save the certificate
                try {
                    if (method_exists($certificate, 'registerOnBlockchain')) {
                        $certificate->registerOnBlockchain();
                        // Refresh to get updated blockchain_hash
                        $certificate->refresh();
                    }
                } catch (\Exception $blockchainError) {
                    // Log the error but don't fail the entire operation
                    Log::warning('Failed to register certificate on blockchain during creation: ' . $blockchainError->getMessage());
                    Log::warning('Blockchain error trace: ' . $blockchainError->getTraceAsString());
                    // Certificate is still created, just not registered yet
                }
                
                // Reload with user relationships for response
                $certificate->load(['student.user', 'issuer.user']);

                DB::commit();
                
                return response()->json([
                    'success' => true,
                    'data' => $certificate,
                    'message' => $certificate->blockchain_hash 
                        ? 'Certificate created and registered on blockchain' 
                        : 'Certificate created successfully. You can register it on blockchain later.'
                ], 201);
            } catch (\Illuminate\Database\QueryException $e) {
                DB::rollBack();
                Log::error('Database error creating certificate: ' . $e->getMessage());
                Log::error('SQL: ' . $e->getSql());
                Log::error('Bindings: ' . json_encode($e->getBindings()));
                throw new \Exception('Database error: ' . $e->getMessage());
            } catch (\Exception $e) {
                DB::rollBack();
                Log::error('Error in certificate creation transaction: ' . $e->getMessage());
                Log::error('Stack trace: ' . $e->getTraceAsString());
                throw $e; // Re-throw to be caught by outer catch
            }
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error creating certificate: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            Log::error('Request data: ' . json_encode($request->all()));
            
            // Return more detailed error in development
            $errorMessage = config('app.debug') 
                ? $e->getMessage() . ' | File: ' . $e->getFile() . ' | Line: ' . $e->getLine()
                : 'Failed to create certificate. Please check the logs for details.';
            
            return response()->json([
                'success' => false,
                'message' => $errorMessage,
                'error' => $e->getMessage(),
                'debug' => config('app.debug') ? [
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'trace' => $e->getTraceAsString()
                ] : null
            ], 500);
        }
    }

    /**
     * Update an existing certificate
     * PUT /api/blockchain/certificates/{id}
     */
    public function updateCertificate(Request $request, $id)
    {
        try {
            $certificate = Certificate::findOrFail($id);
            
            $validator = Validator::make($request->all(), [
                'student_id' => 'sometimes|required|exists:students,id',
                'issued_by' => 'sometimes|required|exists:teachers,id',
                'certificate_type' => 'sometimes|required|in:Completion,Achievement,Maritime Certificate',
                'title' => 'sometimes|required|string|max:255',
                'date_issued' => 'sometimes|required|date',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $certificate->update($validator->validated());
            $certificate->load(['student.user', 'issuer.user']);
            
            return response()->json([
                'success' => true,
                'data' => $certificate,
                'message' => 'Certificate updated successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating certificate: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update certificate',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Register a certificate on the blockchain
     * POST /api/blockchain/certificates/{id}/register
     */
    public function registerCertificateOnBlockchain($id)
    {
        try {
            $certificate = Certificate::findOrFail($id);
            
            if ($certificate->blockchain_hash) {
                return response()->json([
                    'success' => false,
                    'message' => 'Certificate is already registered on blockchain'
                ], 400);
            }

            DB::beginTransaction();

            if (method_exists($certificate, 'registerOnBlockchain')) {
                $certificate->registerOnBlockchain();
            } else {
                // Fallback implementation
                $certificate->blockchain_hash = $certificate->generateBlockchainHash();
                $certificate->blockchain_timestamp = now();
                $certificate->save();

                // Get the user ID for initiated_by
                $initiatedBy = auth()->id();
                
                // If no authenticated user, try to get from teacher's user_id
                if (!$initiatedBy && $certificate->issuer && $certificate->issuer->user_id) {
                    $initiatedBy = $certificate->issuer->user_id;
                }
                
                // Fallback to admin user if still no user ID
                if (!$initiatedBy) {
                    $adminUser = \App\Models\User::where('role', 'admin')->first();
                    $initiatedBy = $adminUser ? $adminUser->id : 1;
                }

                // Create blockchain transaction record
                BlockchainTransaction::create([
                    'transaction_hash' => $certificate->blockchain_hash,
                    'transaction_type' => 'certificate_creation',
                    'initiated_by' => $initiatedBy,
                    'status' => 'confirmed',
                    'submitted_at' => now(),
                ]);
            }

            $certificate->load(['student.user', 'issuer.user']);

            DB::commit();
            
            return response()->json([
                'success' => true,
                'data' => $certificate,
                'message' => 'Certificate registered on blockchain successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error registering certificate on blockchain: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to register certificate on blockchain',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a certificate
     * DELETE /api/blockchain/certificates/{id}
     */
    public function deleteCertificate($id)
    {
        try {
            $certificate = Certificate::findOrFail($id);
            $certificateName = $certificate->title;
            
            // Delete related blockchain transaction if exists
            if ($certificate->blockchainTransaction()->exists()) {
                $certificate->blockchainTransaction()->delete();
            }
            
            // Delete verification records
            $certificate->verifications()->delete();

            $certificate->delete();
            
            return response()->json([
                'success' => true,
                'message' => "Certificate '{$certificateName}' deleted successfully"
            ]);
        } catch (\Exception $e) {
            Log::error('Error deleting certificate: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete certificate',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ========================================================================
    // 🔍 CERTIFICATE VERIFICATION
    // ========================================================================

    /**
     * Verify a certificate by its certificate number
     * POST /api/blockchain/verify
     */
    public function verifyCertificate(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'certificate_number' => 'required|string',
                'verified_by_name' => 'nullable|string|max:255',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $certificate = Certificate::where('certificate_number', $request->certificate_number)
                ->with(['student.user', 'issuer.user', 'blockchainTransaction'])
                ->firstOrFail();
            
            // Verify certificate integrity if it's registered on blockchain
            $integrityVerified = true;
            $integrityMessage = 'Certificate found';
            
            if ($certificate->blockchain_hash) {
                $integrityVerified = $certificate->verifyIntegrity();
                $integrityMessage = $integrityVerified 
                    ? 'Certificate verified and integrity confirmed' 
                    : 'Certificate found but integrity check failed - data may have been tampered with';
            } else {
                $integrityMessage = 'Certificate found but not yet registered on blockchain';
            }
            
            // Create verification record
            $verification = CertificateVerification::create([
                'certificate_id' => $certificate->id,
                'verified_by_name' => $request->verified_by_name ?? 'Public Lookup',
                'verified_at' => now(),
            ]);

            return response()->json([
                'success' => $integrityVerified,
                'data' => [
                    'certificate' => $certificate,
                    'verification_record' => $verification,
                    'integrity_verified' => $integrityVerified,
                ],
                'message' => $integrityMessage
            ]);
        } catch (\Exception $e) {
            Log::error('Error verifying certificate: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Certificate not found or verification failed',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Get verification history
     * GET /api/blockchain/verifications
     */
    public function getVerificationHistory(Request $request)
    {
        try {
            $query = CertificateVerification::with('certificate.student');
            
            // Apply filters
            if ($certificateId = $request->input('certificate_id')) {
                $query->where('certificate_id', $certificateId);
            }
            
            if ($verifierName = $request->input('verified_by_name')) {
                $query->where('verified_by_name', 'like', "%{$verifierName}%");
            }
            
            if (($startDate = $request->input('start_date')) && ($endDate = $request->input('end_date'))) {
                $query->whereBetween('verified_at', [$startDate, $endDate]);
            }
            
            // Search
            if ($search = $request->input('search')) {
                $query->where(function($q) use ($search) {
                    $q->where('verified_by_name', 'like', "%{$search}%")
                      ->orWhereHas('certificate', function($subQ) use ($search) {
                          $subQ->where('certificate_number', 'like', "%{$search}%")
                               ->orWhere('title', 'like', "%{$search}%");
                      });
                });
            }
            
            // Sorting
            $sortBy = $request->input('sort_by', 'verified_at');
            $sortOrder = $request->input('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);
            
            // Pagination
            $perPage = $request->input('per_page', 15);
            $verifications = $query->paginate($perPage);
            
            return response()->json([
                'success' => true,
                'data' => $verifications->items(),
                'pagination' => [
                    'current_page' => $verifications->currentPage(),
                    'last_page' => $verifications->lastPage(),
                    'per_page' => $verifications->perPage(),
                    'total' => $verifications->total()
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching verification history: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve verification history',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a verification record
     * DELETE /api/blockchain/verifications/{id}
     */
    public function deleteVerificationRecord($id)
    {
        try {
            $verification = CertificateVerification::findOrFail($id);
            $verification->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Verification record deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error deleting verification record: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete verification record',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ========================================================================
    // 🖥️ INERTIA VIEWS
    // ========================================================================

    /**
     * Display the blockchain management page
     * GET /admin/blockchain
     */
    public function index()
    {
        return Inertia::render('Admin/BlockchainManagement');
    }
}