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
    protected $description = 'Create or update admin account from environment variables (ADMIN_EMAIL and ADMIN_PASSWORD)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = env('ADMIN_EMAIL');
        $password = env('ADMIN_PASSWORD');

        if (!$email) {
            $this->error('ADMIN_EMAIL environment variable is not set.');
            $this->info('Please set ADMIN_EMAIL in your .env file or Railway Variables.');
            return 1;
        }

        if (!$password) {
            $this->error('ADMIN_PASSWORD environment variable is not set.');
            $this->info('Please set ADMIN_PASSWORD in your .env file or Railway Variables.');
            return 1;
        }

        if (strlen($password) < 8) {
            $this->error('ADMIN_PASSWORD must be at least 8 characters long.');
            return 1;
        }

        // Check if admin user already exists
        $admin = User::where('email', $email)->first();

        if ($admin) {
            // Update existing admin
            $this->info("Found existing admin user: {$admin->name} ({$admin->email})");
            
            // Update password with proper Bcrypt hashing
            $admin->password = Hash::make($password);
            
            // Ensure role is admin
            if ($admin->role !== 'admin') {
                $this->warn("User role is '{$admin->role}', changing to 'admin'...");
                $admin->allowRoleChange = true;
                $admin->role = 'admin';
                unset($admin->allowRoleChange);
            }
            
            // Ensure status is active
            $admin->status = 'active';
            
            $admin->save();
            
            $this->info("✓ Admin account updated successfully!");
            $this->info("  Email: {$email}");
            $this->info("  Password: [Updated]");
            $this->info("  Role: admin");
        } else {
            // Create new admin user
            $name = env('ADMIN_NAME', 'Administrator');
            
            $admin = User::create([
                'name' => $name,
                'email' => $email,
                'password' => Hash::make($password),
                'role' => 'admin',
                'status' => 'active',
                'email_verified_at' => now(),
            ]);
            
            $this->info("✓ Admin account created successfully!");
            $this->info("  Name: {$name}");
            $this->info("  Email: {$email}");
            $this->info("  Password: [Set from environment]");
            $this->info("  Role: admin");
        }

        $this->newLine();
        $this->info("You can now log in with:");
        $this->info("  Email: {$email}");
        $this->info("  Password: [The password you set in ADMIN_PASSWORD]");

        return 0;
    }
}

