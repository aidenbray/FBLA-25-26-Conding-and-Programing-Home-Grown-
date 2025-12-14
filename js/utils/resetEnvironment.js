export function resetAllData() {
    console.log("Resetting environment...");

    // Clear LocalStorage items related to user data
    localStorage.removeItem('favorites');
    localStorage.removeItem('businesses_custom');
    localStorage.removeItem('businesses_deleted_ids');
    localStorage.removeItem('deals_custom');
    localStorage.removeItem('deals_deleted_ids');
    localStorage.removeItem('reviews_custom');
    localStorage.removeItem('reviews_deleted_ids');
    localStorage.removeItem('reviews_hidden');
    localStorage.removeItem('isAdmin'); // Logout admin

    // Reset offline banner state if stored
    // (Offline banner state is usually transient in DOM, but if we stored preference, clear it)

    // We do NOT clear the service worker caches here to ensure the app remains fast/offline-capable.
    // We only want to reset USER data.

    // Notify user
    alert("Environment Reset: All user data, favorites, and admin edits have been cleared.");
    
    // Reload the iframe if it exists, or the page
    const frame = document.getElementById('app-frame');
    if (frame) {
        frame.contentWindow.location.reload();
    } else {
        window.location.reload();
    }
}
