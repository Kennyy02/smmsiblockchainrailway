<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class ResetAdminPassword extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'admin:reset-password 
                            {--email= : The email of the admin user to reset}
                            {--password= : The new password (if not provided, will be prompted)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Reset the password for an admin user (useful when password is not in Bcrypt format)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->option('email');
        
        if (!$email) {
            $email = $this->ask('Enter the admin email address');
        }

        // Find the user
        $user = User::where('email', $email)->first();

        if (!$user) {
            $this->error("User with email '{$email}' not found.");
            return 1;
        }

        $this->info("Found user: {$user->name} ({$user->email})");
        $this->info("Current role: {$user->role}");

        // Get new password
        $password = $this->option('password');
        
        if (!$password) {
            $password = $this->secret('Enter the new password');
            $passwordConfirmation = $this->secret('Confirm the new password');
            
            if ($password !== $passwordConfirmation) {
                $this->error('Passwords do not match!');
                return 1;
            }
        }

        if (strlen($password) < 8) {
            $this->error('Password must be at least 8 characters long!');
            return 1;
        }

        // Confirm before proceeding
        if (!$this->confirm("Are you sure you want to reset the password for {$user->email}?")) {
            $this->info('Password reset cancelled.');
            return 0;
        }

        // Reset the password using Hash::make to ensure it's properly hashed
        // We'll bypass the model's update method and update directly
        $user->password = Hash::make($password);
        $user->save();

        $this->info("✓ Password has been reset successfully for {$user->email}");
        $this->info("You can now log in with the new password.");

        return 0;
    }
}

