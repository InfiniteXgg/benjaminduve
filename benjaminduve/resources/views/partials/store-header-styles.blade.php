<style>
    header {
        background: linear-gradient(90deg, var(--header-start) 0%, var(--header-end) 100%);
        color: #fff;
        border-bottom: 1px solid #000;
        padding: 16px 20px;
    }
    .header-wrap {
        max-width: 1100px;
        margin: 0 auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
    }
    .header-title {
        margin: 0;
        line-height: 0;
    }
    .header-title a {
        color: inherit;
        text-decoration: none;
    }
    .brand-logo {
        display: inline-flex;
        align-items: center;
        color: #fff;
    }
    .brand-logo svg {
        display: block;
        width: 130px;
        height: 48px;
    }
    .header-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
    }
    .header-actions a {
        color: #fff;
        text-decoration: none;
        border: 1px solid #5c5c5c;
        padding: 8px 10px;
        font-size: 13px;
        position: relative;
    }
    .header-actions a.active,
    .header-actions a.active-cart {
        border-color: #fff;
        box-shadow: inset 0 0 0 1px #fff;
    }
    .header-actions .instagram-btn {
        width: 35px;
        height: 35px;
        padding: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
    }
    .header-actions .instagram-btn svg {
        width: 18px;
        height: 18px;
        stroke: currentColor;
        fill: none;
        stroke-width: 1.9;
    }
    .cart-badge {
        position: absolute;
        top: -8px;
        right: -8px;
        min-width: 18px;
        height: 18px;
        border-radius: 999px;
        background: #f7f7f7;
        color: #111;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        font-weight: 700;
    }
</style>
