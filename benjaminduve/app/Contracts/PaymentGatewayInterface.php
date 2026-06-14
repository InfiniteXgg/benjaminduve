<?php

namespace App\Contracts;

use App\Models\Order;
use App\Services\PaymentResult;

interface PaymentGatewayInterface
{
    public function processPayment(Order $order, array $paymentData): PaymentResult;

    public function getPaymentStatus(string $reference): string;

    public function refund(string $reference, int $amount): bool;
}
