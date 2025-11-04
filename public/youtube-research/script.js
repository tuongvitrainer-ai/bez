// ================================
// Utility Functions
// ================================

// Hàm tải CSV về máy
function downloadCSV(csvContent, fileName) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8-sig;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Hiển thị thông báo
function showMessage(type, message) {
    const successMsg = document.getElementById('success-message');
    const errorMsg = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');

    // Ẩn tất cả messages
    successMsg.classList.remove('show');
    errorMsg.classList.remove('show');

    if (type === 'success') {
        successMsg.classList.add('show');
        // Tự động ẩn sau 5 giây
        setTimeout(() => {
            successMsg.classList.remove('show');
        }, 5000);
    } else if (type === 'error') {
        errorText.textContent = message;
        errorMsg.classList.add('show');
    }
}

// ================================
// Main Application Logic
// ================================

document.addEventListener('DOMContentLoaded', () => {
    // Element References
    const apiKeyInput = document.getElementById('api-key');
    const toggleApiKeyBtn = document.getElementById('toggle-api-key');
    const channelListTextarea = document.getElementById('channel-list');
    const submitBtn = document.getElementById('submit-btn');
    const buttonText = submitBtn.querySelector('.button-text');
    const buttonContent = submitBtn.querySelector('.button-content');

    // ================================
    // Toggle Password Visibility
    // ================================
    toggleApiKeyBtn.addEventListener('click', () => {
        const type = apiKeyInput.getAttribute('type') === 'password' ? 'text' : 'password';
        apiKeyInput.setAttribute('type', type);

        // Update icon (optional - you can change SVG here if needed)
        toggleApiKeyBtn.style.color = type === 'text' ? 'var(--primary-color)' : 'var(--text-secondary)';
    });

    // ================================
    // Form Submission
    // ================================
    submitBtn.addEventListener('click', async () => {
        // Get form values
        const apiKey = apiKeyInput.value.trim();
        const channels = channelListTextarea.value.trim();

        // Hide previous messages
        showMessage('hide');

        // Validation
        if (!apiKey || !channels) {
            showMessage('error', 'Vui lòng nhập cả API Key và danh sách kênh.');
            return;
        }

        // Show loading state
        submitBtn.disabled = true;
        buttonContent.style.opacity = '0';

        try {
            // Send request to backend
            const response = await fetch('/tools/research-youtube/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    apiKey: apiKey,
                    channels: channels,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Lỗi không xác định từ máy chủ');
            }

            // Download CSV files
            if (data.channelCsv) {
                downloadCSV(data.channelCsv, 'ket_qua_phan_tich_kenh.csv');
            }

            if (data.videoCsv) {
                setTimeout(() => {
                    downloadCSV(data.videoCsv, 'ket_qua_top_15_videos.csv');
                }, 500);
            }

            // Show success message
            showMessage('success');

        } catch (err) {
            // Show error message
            showMessage('error', err.message);
        } finally {
            // Reset button state
            submitBtn.disabled = false;
            buttonContent.style.opacity = '1';
        }
    });

    // ================================
    // Handle Enter Key in Inputs
    // ================================
    apiKeyInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            channelListTextarea.focus();
        }
    });

    // Submit on Ctrl/Cmd + Enter in textarea
    channelListTextarea.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            submitBtn.click();
        }
    });

    // ================================
    // Auto-resize Textarea
    // ================================
    channelListTextarea.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.max(150, this.scrollHeight) + 'px';
    });

    // ================================
    // Smooth Scroll to Error Message
    // ================================
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.target.classList.contains('show')) {
                mutation.target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest'
                });
            }
        });
    });

    observer.observe(document.getElementById('error-message'), {
        attributes: true,
        attributeFilter: ['class']
    });

    observer.observe(document.getElementById('success-message'), {
        attributes: true,
        attributeFilter: ['class']
    });
});
