<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class SetupAdminFromEnv extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'admin:setup-from-env';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Ensure super admin is env-only (remove any database records with super_admin role)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        try {
            // Always output that we're starting
            $this->info('=== Super Admin Setup from Environment Variables ===');
            $this->info('Starting super admin setup process...');
            
            $email = env('ADMIN_EMAIL');
            $password = env('ADMIN_PASSWORD');

            // Debug: Show what we found
            $this->info('Checking environment variables...');
            $this->info('ADMIN_EMAIL: ' . ($email ?: 'NOT SET'));
            $this->info('ADMIN_PASSWORD: ' . ($password ? '[SET]' : 'NOT SET'));

            if (!$email) {
                $this->error('❌ ADMIN_EMAIL environment variable is not set.');
                $this->info('Please set ADMIN_EMAIL in Railway Variables.');
                $this->info('Skipping super admin setup...');
                return 0; // Return 0 so deployment doesn't fail
            }

            if (!$password) {
                $this->error('❌ ADMIN_PASSWORD environment variable is not set.');
                $this->info('Please set ADMIN_PASSWORD in Railway Variables.');
                $this->info('Skipping super admin setup...');
                return 0; // Return 0 so deployment doesn't fail
            }

            if (strlen($password) < 8) {
                $this->error('❌ ADMIN_PASSWORD must be at least 8 characters long.');
                $this->info('Current length: ' . strlen($password));
                $this->info('Skipping super admin setup...');
                return 0; // Return 0 so deployment doesn't fail
            }

            $this->info("✅ Found ADMIN_EMAIL: {$email}");
            $this->info("✅ Found ADMIN_PASSWORD: [Set, length: " . strlen($password) . "]");

            $this->info('Connecting to database...');
            
            // Super admin is env-only, not in database
            // Remove any existing super_admin records from database (shouldn't exist)
            $superAdmins = User::where('role', 'super_admin')->get();
            
            if ($superAdmins->count() > 0) {
                $this->warn("⚠️  Found {$superAdmins->count()} user(s) with super_admin role in database.");
                $this->info("   Super admin should only exist in environment variables.");
                $this->info("   Removing super_admin records from database...");
                
                foreach ($superAdmins as $superAdmin) {
                    $this->info("   - Removing user: {$superAdmin->email} (ID: {$superAdmin->id})");
                    // Delete or change role to admin if it matches env email
                    if ($superAdmin->email === $email) {
                        // If email matches env, delete it (super admin is env-only)
                        $superAdmin->delete();
                        $this->info("     ✓ Deleted (email matches env, so it's env-managed)");
                    } else {
                        // If email doesn't match, change role to admin (shouldn't happen)
                        $superAdmin->allowRoleChange = true;
                        $superAdmin->role = 'admin';
                        $superAdmin->save();
                        $this->warn("     ⚠ Changed role to 'admin' (email doesn't match env)");
                    }
                }
                
                $this->info("✅ Cleaned up super_admin records from database.");
            } else {
                $this->info("✅ No super_admin records found in database (correct - super admin is env-only).");
            }

            $this->newLine();
            $this->info("🎉 Setup complete! Super admin is configured via environment variables.");
            $this->info("   Super admin credentials:");
            $this->info("   Email: {$email}");
            $this->info("   Password: [Set in ADMIN_PASSWORD environment variable]");
            $this->info("   Note: Super admin is NOT stored in database, only in environment variables.");
            $this->newLine();

            return 0;
        } catch (\Exception $e) {
            $this->error('❌ Error during admin setup:');
            $this->error($e->getMessage());
            $this->error('File: ' . $e->getFile() . ':' . $e->getLine());
            $this->newLine();
            $this->warn('⚠️  Admin setup failed, but deployment will continue...');
            return 0; // Don't fail deployment
        }
    }
}

