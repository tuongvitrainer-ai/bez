// ================================
// Tab Switching Logic
// ================================

document.addEventListener('DOMContentLoaded', () => {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');

            // Remove active class from all tabs
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Add active class to clicked tab
            button.classList.add('active');
            document.getElementById(`${targetTab}-tab`).classList.add('active');
        });
    });

    // ================================
    // Filter Tab Logic
    // ================================

    const apiKeyInput = document.getElementById('api-key');
    const filterKeywordsInput = document.getElementById('filter-keywords');
    const minSubscribersInput = document.getElementById('min-subscribers');
    const minVideosInput = document.getElementById('min-videos');
    const countryFilterSelect = document.getElementById('country-filter');
    const filterSubmitBtn = document.getElementById('filter-submit-btn');
    const filterButtonContent = filterSubmitBtn.querySelector('.button-content');

    // Show/hide message helper for filter tab
    function showFilterMessage(type, message) {
        const successMsg = document.getElementById('filter-success-message');
        const errorMsg = document.getElementById('filter-error-message');
        const errorText = document.getElementById('filter-error-text');
        const successText = document.getElementById('filter-success-text');

        // Hide all messages
        successMsg.classList.remove('show');
        errorMsg.classList.remove('show');

        if (type === 'success') {
            if (message) {
                successText.textContent = message;
            }
            successMsg.classList.add('show');
            // Auto-hide after 5 seconds
            setTimeout(() => {
                successMsg.classList.remove('show');
            }, 5000);
        } else if (type === 'error') {
            errorText.textContent = message;
            errorMsg.classList.add('show');
        }
    }

    // CSV download helper (reuse from script.js)
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

    // Filter form submission
    filterSubmitBtn.addEventListener('click', async () => {
        const apiKey = apiKeyInput.value.trim();
        const keywords = filterKeywordsInput.value.trim();
        const minSubscribers = minSubscribersInput.value;
        const minVideos = minVideosInput.value;
        const country = countryFilterSelect.value;

        // Hide previous messages
        showFilterMessage('hide');

        // Validation
        if (!apiKey) {
            showFilterMessage('error', 'Vui lòng nhập API Key ở trên.');
            return;
        }

        if (!keywords) {
            showFilterMessage('error', 'Vui lòng nhập từ khóa tìm kiếm.');
            return;
        }

        // Show loading state
        filterSubmitBtn.disabled = true;
        filterButtonContent.style.opacity = '0';

        try {
            // Send request to backend
            const response = await fetch('/tools/research-youtube/api/run-filter', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    apiKey: apiKey,
                    keywords: keywords,
                    minSubscribers: minSubscribers,
                    minVideos: minVideos,
                    country: country
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Lỗi không xác định từ máy chủ');
            }

            // Download CSV file
            if (data.channelCsv) {
                downloadCSV(data.channelCsv, 'ket_qua_loc_kenh_youtube.csv');
            }

            // Show success message with channel count
            const successMessage = `Đã tải xuống file CSV chứa ${data.totalChannels} kênh phù hợp!`;
            showFilterMessage('success', successMessage);

        } catch (err) {
            // Show error message
            showFilterMessage('error', err.message);
        } finally {
            // Reset button state
            filterSubmitBtn.disabled = false;
            filterButtonContent.style.opacity = '1';
        }
    });

    // Submit on Ctrl/Cmd + Enter in textarea
    filterKeywordsInput.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            filterSubmitBtn.click();
        }
    });

    // Auto-resize textarea
    filterKeywordsInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.max(60, this.scrollHeight) + 'px';
    });

    // Smooth scroll to message
    const filterObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.target.classList.contains('show')) {
                mutation.target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest'
                });
            }
        });
    });

    filterObserver.observe(document.getElementById('filter-error-message'), {
        attributes: true,
        attributeFilter: ['class']
    });

    filterObserver.observe(document.getElementById('filter-success-message'), {
        attributes: true,
        attributeFilter: ['class']
    });
});
