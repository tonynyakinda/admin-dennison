// admin/ui.js (NEW FILE)

document.addEventListener('DOMContentLoaded', () => {

    // --- CUSTOM ALERT (TOAST) LOGIC ---
    const customAlert = document.getElementById('custom-alert');
    let alertTimeout;

    window.showAlert = function (message, type = 'info', duration = 5000) {
        if (!customAlert) {
            console.error("Custom alert element not found in the DOM.");
            return;
        }
        const alertMessage = customAlert.querySelector('.alert-message');
        clearTimeout(alertTimeout);
        alertMessage.textContent = message;
        customAlert.className = 'custom-alert';
        customAlert.classList.add(`alert-${type}`);
        customAlert.classList.add('active');
        alertTimeout = setTimeout(() => {
            customAlert.classList.remove('active');
        }, duration);
    };

    if (customAlert) {
        const closeButton = customAlert.querySelector('.close-alert');
        closeButton.addEventListener('click', () => {
            clearTimeout(alertTimeout);
            customAlert.classList.remove('active');
        });
    }

    // --- CUSTOM CONFIRMATION MODAL LOGIC ---
    const confirmModal = document.getElementById('confirm-modal');
    if (confirmModal) {
        const confirmTitleEl = confirmModal.querySelector('.confirm-title');
        const confirmTextEl = confirmModal.querySelector('.confirm-text');
        const btnYes = document.getElementById('confirm-btn-yes');
        const btnNo = document.getElementById('confirm-btn-no');

        window.showConfirm = function (options = {}) {
            const {
                title = 'Are you sure?',
                text = 'This action cannot be undone.',
                confirmButtonText = 'Delete'
            } = options;

            confirmTitleEl.textContent = title;
            confirmTextEl.textContent = text;
            btnYes.textContent = confirmButtonText;

            confirmModal.classList.add('active');

            return new Promise((resolve) => {
                const handleYes = () => {
                    confirmModal.classList.remove('active');
                    cleanup();
                    resolve(true);
                };

                const handleNo = () => {
                    confirmModal.classList.remove('active');
                    cleanup();
                    resolve(false);
                };

                btnYes.addEventListener('click', handleYes, { once: true });
                btnNo.addEventListener('click', handleNo, { once: true });

                function cleanup() {
                    btnYes.removeEventListener('click', handleYes);
                    btnNo.removeEventListener('click', handleNo);
                }
            });
        };
    }
});