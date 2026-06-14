<?php

namespace App\Services;

use App\Contracts\PaymentGatewayInterface;
use App\Models\Order;

class PlaceholderPaymentGateway implements PaymentGatewayInterface
{
    public function processPayment(Order $order, array $paymentData): PaymentResult
    {
        return new PaymentResult(
            success: true,
            reference: 'PH-' . time(),
            status: 'prototype_pending',
            message: 'PLACEHOLDER - Reemplazar con proveedor real',
        );
    }

    public function getPaymentStatus(string $reference): string
    {
        return 'prototype_pending';
    }

    public function refund(string $reference, int $amount): bool
    {
        return true;
    }
}
