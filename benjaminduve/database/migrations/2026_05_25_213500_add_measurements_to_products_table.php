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
        Schema::table('products', function (Blueprint $table) {
            $table->string('size', 120)->nullable()->after('description');
            $table->decimal('height_cm', 8, 2)->nullable()->after('size');
            $table->decimal('width_cm', 8, 2)->nullable()->after('height_cm');
            $table->decimal('depth_cm', 8, 2)->nullable()->after('width_cm');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['size', 'height_cm', 'width_cm', 'depth_cm']);
        });
    }
};

