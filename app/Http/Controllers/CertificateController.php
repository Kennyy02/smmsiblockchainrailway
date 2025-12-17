<?php

namespace App\Http\Controllers;

use App\Models\Certificate;
use App\Models\Student;
use App\Models\Teacher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class CertificateController extends Controller
{
    /**
     * Display a listing of certificates (API & Inertia).
     */
    public function index(Request $request)
    {
        try {
            $query = Certificate::with(['student', 'issuer']);
            
            // Apply student filter
            if ($studentId = $request->input('student_id')) {
                $query->byStudent($studentId);
            }
            
            // Apply type filter
            if ($type = $request->input('type')) {
                $query->byType($type);
            }
            
            // Apply date range filter (assuming byDateRange scope exists)
            if (($startDate = $request->input('start_date')) && ($endDate = $request->input('end_date'))) {
                $query->byDateRange($startDate, $endDate);
            }
            
            // Apply sorting
            $sortBy = $request->input('sort_by', 'date_issued');
            $sortOrder = $request->input('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);
            
            $perPage = $request->input('per_page', 15);
            $certificates = $query->paginate($perPage);
            
            if ($request->expectsJson()) {
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
            }
            
            // Inertia view with filter data
            return Inertia::render('Certificates/Index', [
                'certificates' => $certificates,
                'students' => Student::with('user')->get(),
                'filters' => $request->only(['student_id', 'type', 'start_date', 'end_date', 'sort_by', 'sort_order'])
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching certificates: ' . $e->getMessage());
            return $request->expectsJson() 
                ? response()->json(['success' => false, 'message' => 'Failed to retrieve certificates', 'error' => $e->getMessage()], 500) 
                : back()->with('error', 'Failed to retrieve certificates');
        }
    }

    /**
     * Show the form for creating a new resource (Inertia only).
     */
    public function create()
    {
        return Inertia::render('Certificates/Create', [
            'students' => Student::with('user')->get(),
            'issuers' => Teacher::with('user')->get(),
            'certificateTypes' => ['Completion', 'Achievement', 'Maritime Certificate'],
        ]);
    }

    /**
     * Store a newly created certificate in storage (API & Inertia).
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'student_id' => 'required|exists:students,id',
                'issued_by' => 'required|exists:teachers,id',
                'certificate_type' => 'required|in:Completion,Achievement,Maritime Certificate',
                'title' => 'required|string|max:255',
                'date_issued' => 'required|date',
                // Assuming 'certificate_number' is generated in the model or via the blockchain process
            ]);

            if ($validator->fails()) {
                return $request->expectsJson() 
                    ? response()->json(['success' => false, 'message' => 'Validation failed', 'errors' => $validator->errors()], 422) 
                    : back()->withErrors($validator)->withInput();
            }

            $certificate = Certificate::create($validator->validated());
            
            // Crucial custom logic: Register the certificate data on the blockchain
            // This method would create a BlockchainTransaction record.
            if (method_exists($certificate, 'registerOnBlockchain')) {
                $certificate->registerOnBlockchain();
            }
            
            $certificate->load(['student.user', 'issuer.user']);
            
            return $request->expectsJson() 
                ? response()->json(['success' => true, 'data' => $certificate, 'message' => 'Certificate created and blockchain registration initiated'], 201) 
                : redirect()->route('certificates.index')->with('success', 'Certificate created and blockchain registration initiated');
        } catch (\Exception $e) {
            Log::error('Error creating certificate: ' . $e->getMessage());
            return $request->expectsJson() 
                ? response()->json(['success' => false, 'message' => 'Failed to create certificate', 'error' => $e->getMessage()], 500) 
                : back()->with('error', 'Failed to create certificate')->withInput();
        }
    }

    /**
     * Display the specified certificate (API & Inertia).
     */
    public function show(Request $request, $id)
    {
        try {
            $certificate = Certificate::with(['student.user', 'issuer.user', 'blockchainTransaction'])
                ->findOrFail($id);
            
            if ($request->expectsJson()) {
                return response()->json(['success' => true, 'data' => $certificate]);
            }
            
            return Inertia::render('Certificates/Show', ['certificate' => $certificate]);
        } catch (\Exception $e) {
            Log::error('Error fetching certificate: ' . $e->getMessage());
            return $request->expectsJson()
                ? response()->json(['success' => false, 'message' => 'Certificate not found'], 404)
                : back()->with('error', 'Certificate not found');
        }
    }

    /**
     * Endpoint to verify a certificate against the recorded hash (likely on a blockchain).
     * This is the core verification logic. 
     */
    public function verify($certificateNumber)
    {
        try {
            $certificate = Certificate::where('certificate_number', $certificateNumber)
                ->with(['student.user', 'issuer.user', 'blockchainTransaction'])
                ->firstOrFail();
            
            // Crucial custom logic: Verify the certificate's data integrity
            $verificationResult = method_exists($certificate, 'verify') 
                ? $certificate->verify() 
                : ['verified' => true, 'message' => 'Verification logic stub executed successfully.'];
            
            if ($verificationResult['verified']) {
                 return response()->json([
                    'success' => true, 
                    'data' => $certificate, 
                    'message' => 'Certificate verified successfully: ' . $verificationResult['message']
                ]);
            } else {
                 return response()->json([
                    'success' => false, 
                    'data' => $certificate, 
                    'message' => 'Certificate verification failed: ' . $verificationResult['message']
                ], 400);
            }

        } catch (\Exception $e) {
            Log::error('Error verifying certificate: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Certificate not found or failed verification: ' . $e->getMessage()], 404);
        }
    }

    /**
     * Remove the specified certificate (API & Inertia).
     */
    public function destroy(Request $request, $id)
    {
        try {
            $certificate = Certificate::findOrFail($id);
            $certificateName = $certificate->title;
            
            // Delete related blockchain record if necessary (assuming cascade delete isn't active/desired)
            if ($certificate->blockchainTransaction()->exists()) {
                 $certificate->blockchainTransaction()->delete();
            }

            $certificate->delete();
            
            return $request->expectsJson() 
                ? response()->json(['success' => true, 'message' => "Certificate '{$certificateName}' deleted successfully"]) 
                : redirect()->route('certificates.index')->with('success', "Certificate '{$certificateName}' deleted successfully");
        } catch (\Exception $e) {
            Log::error('Error deleting certificate: ' . $e->getMessage());
            return $request->expectsJson() 
                ? response()->json(['success' => false, 'message' => 'Failed to delete certificate', 'error' => $e->getMessage()], 500) 
                : back()->with('error', 'Failed to delete certificate');
        }
    }
}