<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hero_carousel_slides', function (Blueprint $table) {
            $table->unsignedInteger('image_width')->nullable()->after('image');
            $table->unsignedInteger('image_height')->nullable()->after('image_width');
            $table->decimal('crop_focus_x', 7, 6)->default(0.5)->after('image_height');
            $table->decimal('crop_focus_y', 7, 6)->default(0.5)->after('crop_focus_x');
            $table->decimal('crop_zoom', 5, 2)->default(1)->after('crop_focus_y');
        });
    }

    public function down(): void
    {
        Schema::table('hero_carousel_slides', function (Blueprint $table) {
            $table->dropColumn([
                'image_width',
                'image_height',
                'crop_focus_x',
                'crop_focus_y',
                'crop_zoom',
            ]);
        });
    }
};
