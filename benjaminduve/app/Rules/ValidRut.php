<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class ValidRut implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (!is_string($value) || !$this->isValidRut($value)) {
            $fail('El RUT ingresado no es válido.');
        }
    }

    private function isValidRut(string $rut): bool
    {
        if (!preg_match('/^(\d{1,2}(?:\.\d{3})*|\d{7,8})-([\dkK])$/', $rut, $matches)) {
            return false;
        }

        $body = str_replace('.', '', $matches[1]);
        $providedVerifier = strtoupper($matches[2]);
        $calculatedVerifier = $this->calculateVerifier($body);

        return $providedVerifier === $calculatedVerifier;
    }

    private function calculateVerifier(string $body): string
    {
        $series = [2, 3, 4, 5, 6, 7];
        $sum = 0;
        $seriesIndex = 0;

        for ($i = strlen($body) - 1; $i >= 0; $i--) {
            $sum += ((int) $body[$i]) * $series[$seriesIndex];
            $seriesIndex = ($seriesIndex + 1) % count($series);
        }

        $remainder = 11 - ($sum % 11);

        return match ($remainder) {
            11 => '0',
            10 => 'K',
            default => (string) $remainder,
        };
    }
}
