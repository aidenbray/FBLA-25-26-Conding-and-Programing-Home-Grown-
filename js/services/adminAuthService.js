const ADMIN_HASH = "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918"; // SHA-256 for "admin"

export async function loginAdmin(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    if (hashHex === ADMIN_HASH) {
        localStorage.setItem("isAdmin", "true");
        return true;
    }
    return false;
}

export function logoutAdmin() {
    localStorage.removeItem("isAdmin");
    window.location.hash = '#/admin';
    window.location.reload();
}

export function isAdmin() {
    return localStorage.getItem("isAdmin") === "true";
}
