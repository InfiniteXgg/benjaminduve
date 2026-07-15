<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hero_carousel_slides', function (Blueprint $table) {
            $table->id();
            $table->string('eyebrow', 80);
            $table->string('title', 120);
            $table->string('cta', 80);
            $table->longText('image');
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hero_carousel_slides');
    }
};
