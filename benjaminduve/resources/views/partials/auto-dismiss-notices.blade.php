<style>
    [data-auto-dismiss] {
        transition: opacity 0.3s ease, transform 0.3s ease;
    }
    [data-auto-dismiss].is-hiding {
        opacity: 0;
        transform: translateY(-6px);
    }
</style>
<script>
    (() => {
        const notices = document.querySelectorAll('[data-auto-dismiss]');
        notices.forEach((notice) => {
            const delay = Number(notice.dataset.autoDismiss || 2600);
            window.setTimeout(() => {
                if (!notice.isConnected) return;
                notice.classList.add('is-hiding');
                window.setTimeout(() => {
                    if (notice.isConnected) {
                        notice.remove();
                    }
                }, 320);
            }, delay);
        });
    })();
</script>
