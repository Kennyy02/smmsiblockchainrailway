<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->string('audit_type'); // 'created', 'updated', 'deleted', 'viewed'
            $table->string('auditable_type'); // Model class name (e.g., 'App\Models\Student')
            $table->unsignedBigInteger('auditable_id'); // ID of the record
            $table->unsignedBigInteger('user_id')->nullable(); // Who made the change
            $table->string('user_type')->nullable(); // User role/type
            $table->string('ip_address')->nullable();
            $table->text('user_agent')->nullable();
            $table->string('url')->nullable(); // API endpoint or route
            $table->string('request_method', 10)->nullable(); // GET, POST, PUT, DELETE
            $table->json('old_values')->nullable(); // Before state (for updates)
            $table->json('new_values')->nullable(); // After state (for creates/updates)
            $table->json('changes')->nullable(); // Only changed fields (for updates)
            $table->text('description')->nullable(); // Human-readable description
            $table->string('blockchain_hash', 64)->nullable(); // SHA-256 hash of the audit entry
            $table->unsignedBigInteger('blockchain_tx_id')->nullable(); // Link to blockchain_transactions
            $table->timestamps();

            // Indexes for performance
            $table->index(['auditable_type', 'auditable_id']);
            $table->index('user_id');
            $table->index('audit_type');
            $table->index('created_at');
            $table->index('blockchain_hash');
            $table->index('blockchain_tx_id');

            // Foreign key to blockchain_transactions
            $table->foreign('blockchain_tx_id')->references('id')->on('blockchain_transactions')->onDelete('set null');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};

