<?php

namespace App\Services;

class PaymentResult
{
    public function __construct(
        public readonly bool $success,
        public readonly string $reference,
        public readonly string $status,
        public readonly string $message = '',
    ) {}
}
