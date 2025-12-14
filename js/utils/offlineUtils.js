export function isOffline() {
    return !navigator.onLine;
}

export function showOfflineBanner() {
    let banner = document.getElementById('offline-banner');
    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'offline-banner';
        banner.textContent = 'Offline mode: some data may be cached.';
        document.body.prepend(banner);
    }
    banner.classList.add('visible');
}

export function hideOfflineBanner() {
    const banner = document.getElementById('offline-banner');
    if (banner) {
        banner.classList.remove('visible');
    }
}

export function initOfflineDetection() {
    window.addEventListener('online', hideOfflineBanner);
    window.addEventListener('offline', showOfflineBanner);

    if (isOffline()) {
        showOfflineBanner();
    }
    
    // Expose for Judge Mode
    window.showOfflineBanner = showOfflineBanner;
}
