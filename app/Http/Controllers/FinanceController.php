<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\Classes;
use App\Models\Grade;
use App\Models\Subject;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\Builder;

class FinanceController extends Controller
{
    /**
     * Calculate mock balance data for a student (for demo purposes)
     */
    private function calculateStudentBalance($student): array
    {
        // Generate consistent but realistic financial data based on student ID
        $baseAmount = (crc32($student->student_id) % 50000) + 5000;
        $balance = $baseAmount * 0.3; // 30% pending
        $paid = $baseAmount * 0.7; // 70% paid
        $miscFee = (crc32($student->student_id . 'misc') % 5000) + 500;
        
        return [
            'balance' => round($balance, 2),
            'amount_paid' => round($paid, 2),
            'miscellaneous_fee' => round($miscFee, 2),
            'total' => round($baseAmount, 2),
        ];
    }

    /**
     * Get finance statistics
     */
    public function getStats()
    {
        try {
            $students = Student::all();
            
            // Calculate totals from all students
            $totalRevenue = 0;
            $totalBalance = 0;
            $totalMiscFees = 0;
            $paidAccounts = 0;
            $pendingAccounts = 0;
            
            foreach ($students as $student) {
                $data = $this->calculateStudentBalance($student);
                $totalRevenue += $data['amount_paid'];
                $totalBalance += $data['balance'];
                $totalMiscFees += $data['miscellaneous_fee'];
                
                if ($data['balance'] == 0) {
                    $paidAccounts++;
                } else {
                    $pendingAccounts++;
                }
            }
            
            $totalStudents = $students->count();
            $avgBalance = $totalStudents > 0 ? $totalBalance / $totalStudents : 0;

            return response()->json([
                'success' => true,
                'data' => [
                    'total_revenue' => round($totalRevenue, 2),
                    'pending_balance' => round($totalBalance, 2),
                    'total_miscellaneous_fees' => round($totalMiscFees, 2),
                    'total_students' => $totalStudents,
                    'average_balance_per_student' => round($avgBalance, 2),
                    'paid_accounts' => $paidAccounts,
                    'pending_accounts' => $pendingAccounts,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load finance statistics: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get classes with financial data
     */
    public function getClassesFinance(Request $request)
    {
        try {
            $query = Classes::query();

            // Search filter
            if ($request->get('search')) {
                $search = $request->get('search');
                $query->where('class_code', 'like', "%{$search}%")
                    ->orWhere('class_name', 'like', "%{$search}%");
            }

            $classes = $query->with('students')->get();

            // Map to response format
            $classesData = $classes->map(function ($class) {
                $students = $class->students ?? [];
                $studentCount = count($students);
                
                // Calculate balances for all students in this class
                $totalBalance = 0;
                foreach ($students as $student) {
                    $data = $this->calculateStudentBalance($student);
                    $totalBalance += $data['balance'];
                }
                
                $avgBalance = $studentCount > 0 ? $totalBalance / $studentCount : 0;

                return [
                    'id' => $class->id,
                    'class_code' => $class->class_code,
                    'class_name' => $class->class_name,
                    'program' => $class->program,
                    'total_students' => $studentCount,
                    'total_balance' => round($totalBalance, 2),
                    'average_balance' => round($avgBalance, 2),
                    'year_level' => $class->year_level,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $classesData,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load classes finance: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get students in a specific class with financial records
     */
    public function getClassStudentsFinance(Classes $class, Request $request)
    {
        try {
            $query = $class->students();

            // Search filter
            if ($request->get('search')) {
                $search = $request->get('search');
                $query->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('student_id', 'like', "%{$search}%");
            }

            $students = $query->paginate($request->get('per_page', 10));

            // Map to response format
            $studentsData = $students->map(function ($student) {
                $financeData = $this->calculateStudentBalance($student);
                return [
                    'id' => $student->id,
                    'student_id' => $student->student_id,
                    'full_name' => $student->first_name . ' ' . $student->last_name,
                    'email' => $student->email,
                    'balance' => $financeData['balance'],
                    'miscellaneous_fee' => $financeData['miscellaneous_fee'],
                    'total_paid' => $financeData['amount_paid'],
                    'program' => $student->program,
                    'class_id' => $class->id,
                    'subjects_enrolled' => $student->grades()->distinct('class_subject_id')->count() ?? 0,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $studentsData,
                'class_info' => [
                    'class_code' => $class->class_code,
                    'class_name' => $class->class_name,
                    'program' => $class->program,
                ],
                'pagination' => [
                    'current_page' => $students->currentPage(),
                    'last_page' => $students->lastPage(),
                    'per_page' => $students->perPage(),
                    'total' => $students->total(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load class students finance: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get all students with financial records
     */
    public function getStudentsFinance(Request $request)
    {
        try {
            $query = Student::query();

            // Search filter
            if ($request->get('search')) {
                $search = $request->get('search');
                $query->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('student_id', 'like', "%{$search}%");
            }

            $students = $query->paginate($request->get('per_page', 10));

            // Map to response format
            $studentsData = $students->map(function ($student) {
                $financeData = $this->calculateStudentBalance($student);
                return [
                    'id' => $student->id,
                    'student_id' => $student->student_id,
                    'full_name' => $student->first_name . ' ' . $student->last_name,
                    'email' => $student->email,
                    'balance' => $financeData['balance'],
                    'miscellaneous_fee' => $financeData['miscellaneous_fee'],
                    'total_paid' => $financeData['amount_paid'],
                    'program' => $student->program,
                    'class_id' => $student->current_class_id ?? null,
                    'subjects_enrolled' => $student->grades()->distinct('class_subject_id')->count() ?? 0,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $studentsData,
                'pagination' => [
                    'current_page' => $students->currentPage(),
                    'last_page' => $students->lastPage(),
                    'per_page' => $students->perPage(),
                    'total' => $students->total(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load students finance: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get student financial details with enrolled subjects
     */
    public function getStudentFinanceDetails($studentId)
    {
        try {
            $student = Student::findOrFail($studentId);
            $financeData = $this->calculateStudentBalance($student);
            
            // Get subjects from grades
            $subjects = $student->grades()
                ->with('classSubject.subject')
                ->get()
                ->groupBy('class_subject_id')
                ->map(function ($grades) {
                    $subject = $grades->first()->classSubject->subject;
                    return [
                        'id' => $subject->id,
                        'subject_code' => $subject->subject_code,
                        'subject_name' => $subject->subject_name,
                        'price' => round($subject->price ?? 0, 2),
                    ];
                })
                ->values();

            return response()->json([
                'success' => true,
                'data' => [
                    'student' => [
                        'id' => $student->id,
                        'student_id' => $student->student_id,
                        'full_name' => $student->first_name . ' ' . $student->last_name,
                        'email' => $student->email,
                        'balance' => $financeData['balance'],
                        'miscellaneous_fee' => $financeData['miscellaneous_fee'],
                        'total_paid' => $financeData['amount_paid'],
                        'program' => $student->program,
                        'class_id' => $student->current_class_id,
                    ],
                    'subjects' => $subjects,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load student finance details: ' . $e->getMessage(),
            ], 500);
        }
    }
}

