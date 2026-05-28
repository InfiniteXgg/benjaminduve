<?php

namespace App\Mail;

use App\Models\Product;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class LowStockAlertMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Product $product,
        public int $threshold,
    ) {}

    public function envelope(): Envelope
    {
        $status = (int) $this->product->stock === 0 ? 'agotado' : 'por agotarse';

        return new Envelope(
            subject: 'Alerta de stock: ' . $this->product->name . ' (' . $status . ')',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.low-stock-alert',
        );
    }
}
