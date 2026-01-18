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
    protected $description = 'Create or update super admin account from environment variables (ADMIN_EMAIL and ADMIN_PASSWORD)';

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
            // Check if admin user already exists
            $admin = User::where('email', $email)->first();

            if ($admin) {
                // Update existing admin
                $this->info("📝 Found existing admin user: {$admin->name} ({$admin->email})");
                $this->info("   Current role: {$admin->role}");
                $this->info("   Current status: {$admin->status}");
                
                // Update password with proper Bcrypt hashing
                $this->info('Hashing password...');
                $admin->password = Hash::make($password);
                
                // Ensure role is super_admin
                if ($admin->role !== 'super_admin') {
                    $this->warn("⚠️  User role is '{$admin->role}', changing to 'super_admin'...");
                    $admin->allowRoleChange = true;
                    $admin->role = 'super_admin';
                    unset($admin->allowRoleChange);
                }
                
                // Ensure status is active
                $admin->status = 'active';
                
                $this->info('Saving super admin user...');
                $admin->save();
                
                $this->info("✅ Super admin account updated successfully!");
                $this->info("   Email: {$email}");
                $this->info("   Password: [Updated with Bcrypt]");
                $this->info("   Role: super_admin");
                $this->info("   Status: active");
            } else {
                // Create new super admin user
                $name = env('ADMIN_NAME', 'Administrator');
                $this->info("📝 Creating new super admin user...");
                $this->info("   Name: {$name}");
                $this->info("   Email: {$email}");
                
                $this->info('Hashing password...');
                $hashedPassword = Hash::make($password);
                
                $this->info('Creating user record...');
                $admin = User::create([
                    'name' => $name,
                    'email' => $email,
                    'password' => $hashedPassword,
                    'role' => 'super_admin',
                    'status' => 'active',
                    'email_verified_at' => now(),
                ]);
                
                $this->info("✅ Super admin account created successfully!");
                $this->info("   Name: {$name}");
                $this->info("   Email: {$email}");
                $this->info("   Password: [Set from environment, hashed with Bcrypt]");
                $this->info("   Role: super_admin");
                $this->info("   Status: active");
                $this->info("   User ID: {$admin->id}");
            }

            $this->newLine();
            $this->info("🎉 Setup complete! You can now log in with:");
            $this->info("   Email: {$email}");
            $this->info("   Password: [The password you set in ADMIN_PASSWORD]");
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

