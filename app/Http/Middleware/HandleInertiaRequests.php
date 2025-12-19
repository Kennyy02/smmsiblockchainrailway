<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        return [
            ...parent::share($request),
            'csrf_token' => csrf_token(),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $request->user() ? $request->user()->loadMissing([
                    'student.course', 
                    'student.currentClass',
                    'teacher.advisoryClass',
                    'teacher.subjects',
                    'parent.students.course',
                    'parent.students.currentClass'
                ]) : null,
            ],
            'ziggy' => fn (): array => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'contactInfo' => [
                'schoolName' => env('SCHOOL_NAME', 'Southern Mindoro Maritime School, Inc.'),
                'schoolShortName' => env('SCHOOL_SHORT_NAME', 'Southern Mindoro'),
                'schoolSubtitle' => env('SCHOOL_SUBTITLE', 'Maritime School, Inc.'),
                'addressCity' => env('SCHOOL_ADDRESS_CITY', 'Bagumbayan, Roxas'),
                'addressProvince' => env('SCHOOL_ADDRESS_PROVINCE', 'Oriental Mindoro'),
                'addressCountry' => env('SCHOOL_ADDRESS_COUNTRY', 'Philippines'),
                'phone' => env('SCHOOL_PHONE', '+63 XXX XXX XXXX'),
                'email' => env('SCHOOL_EMAIL', 'info@smms.edu.ph'),
                'emailSupport' => env('SCHOOL_EMAIL_SUPPORT', 'support@smms.edu.ph'),
                'facebookUrl' => env('SCHOOL_FACEBOOK_URL', 'https://www.facebook.com/smmsi.shs'),
                'websiteUrl' => env('SCHOOL_WEBSITE_URL', 'https://smmsblockchain.up.railway.app/'),
                'officeHours' => env('SCHOOL_OFFICE_HOURS', 'Monday - Friday, 8:00 AM - 5:00 PM'),
                'copyrightYear' => env('SCHOOL_COPYRIGHT_YEAR', date('Y')),
                'systemName' => env('SYSTEM_NAME', 'Blockchain Grading System'),
            ],
        ];
    }
}
