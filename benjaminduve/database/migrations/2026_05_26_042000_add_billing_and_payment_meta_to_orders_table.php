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
        Schema::table('orders', function (Blueprint $table) {
            $table->string('billing_document_type', 40)->default('boleta_electronica')->after('customer_email');
            $table->string('billing_tax_id', 40)->nullable()->after('billing_document_type');
            $table->string('billing_address')->nullable()->after('billing_tax_id');
            $table->string('billing_city', 120)->nullable()->after('billing_address');
            $table->string('billing_contact_phone', 40)->nullable()->after('billing_city');
            $table->text('billing_notes')->nullable()->after('billing_contact_phone');
            $table->json('payment_meta')->nullable()->after('payment_reference');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn([
                'billing_document_type',
                'billing_tax_id',
                'billing_address',
                'billing_city',
                'billing_contact_phone',
                'billing_notes',
                'payment_meta',
            ]);
        });
    }
};
