import { loadBusinesses } from './businessService.js';
import { loadDeals } from './dealsService.js';
import { mergeReviews } from './reviewService.js';

// Helper to get local storage data
function getLocalData(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
}

function setLocalData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// --- Businesses ---
export async function getMergedBusinesses() {
    return await loadBusinesses();
}

export function saveBusiness(business) {
    const custom = getLocalData('businesses_custom');
    const index = custom.findIndex(b => b.id === business.id);
    if (index !== -1) {
        custom[index] = business;
    } else {
        custom.push(business);
    }
    setLocalData('businesses_custom', custom);
}

export function deleteBusiness(id) {
    const deletedIds = getLocalData('businesses_deleted_ids');
    if (!deletedIds.includes(id)) {
        deletedIds.push(id);
        setLocalData('businesses_deleted_ids', deletedIds);
    }
    
    const custom = getLocalData('businesses_custom');
    const newCustom = custom.filter(b => b.id !== id);
    setLocalData('businesses_custom', newCustom);
}

// --- Deals ---
export async function getMergedDeals() {
    return await loadDeals();
}

export function saveDeal(deal) {
    const custom = getLocalData('deals_custom');
    const index = custom.findIndex(d => d.id === deal.id);
    if (index !== -1) {
        custom[index] = deal;
    } else {
        custom.push(deal);
    }
    setLocalData('deals_custom', custom);
}

export function deleteDeal(id) {
    const deletedIds = getLocalData('deals_deleted_ids');
    if (!deletedIds.includes(id)) {
        deletedIds.push(id);
        setLocalData('deals_deleted_ids', deletedIds);
    }
    
    const custom = getLocalData('deals_custom');
    const newCustom = custom.filter(d => d.id !== id);
    setLocalData('deals_custom', newCustom);
}

// --- Reviews ---
export async function getMergedReviews() {
    // For admin, we want ALL reviews, including hidden ones.
    // mergeReviews in reviewService returns all reviews (including hidden, but excluding deleted).
    // We need to manually attach the 'isHidden' flag for the UI.
    const reviews = await mergeReviews();
    const hiddenIds = getLocalData('reviews_hidden');
    
    return reviews.map(r => ({
        ...r,
        isHidden: hiddenIds.includes(r.id)
    }));
}

export function toggleReviewVisibility(id) {
    const hiddenIds = getLocalData('reviews_hidden');
    const index = hiddenIds.indexOf(id);
    if (index !== -1) {
        hiddenIds.splice(index, 1);
    } else {
        hiddenIds.push(id);
    }
    setLocalData('reviews_hidden', hiddenIds);
}

export function deleteReview(id) {
    const deletedIds = getLocalData('reviews_deleted_ids');
    if (!deletedIds.includes(id)) {
        deletedIds.push(id);
        setLocalData('reviews_deleted_ids', deletedIds);
    }
}

// --- Integrity Checks ---
export async function runIntegrityChecks() {
    const businesses = await getMergedBusinesses();
    const deals = await getMergedDeals();
    const reviews = await getMergedReviews();
    
    const issues = [];

    // Check 1: Duplicate IDs
    const checkDuplicates = (items, type) => {
        const ids = items.map(i => i.id);
        const duplicates = ids.filter((item, index) => ids.indexOf(item) !== index);
        if (duplicates.length > 0) {
            issues.push(`Duplicate ${type} IDs found: ${duplicates.join(', ')}`);
        }
    };
    checkDuplicates(businesses, 'Business');
    checkDuplicates(deals, 'Deal');
    checkDuplicates(reviews, 'Review');

    // Check 2: Missing Fields (Basic check)
    businesses.forEach(b => {
        if (!b.name) issues.push(`Business ${b.id} missing name`);
        if (!b.category) issues.push(`Business ${b.id} missing category`);
    });

    // Check 3: Invalid Dates
    deals.forEach(d => {
        if (new Date(d.endDate) < new Date(d.startDate)) {
            issues.push(`Deal ${d.id} has endDate before startDate`);
        }
    });

    // Check 4: Non-matching relationships
    const businessIds = businesses.map(b => b.id);
    
    reviews.forEach(r => {
        if (!businessIds.includes(r.businessId)) {
            issues.push(`Review ${r.id} references missing businessId ${r.businessId}`);
        }
    });

    deals.forEach(d => {
        if (!businessIds.includes(d.businessId)) {
            issues.push(`Deal ${d.id} references missing businessId ${d.businessId}`);
        }
    });

    return issues;
}

// --- Import/Export ---
export async function exportData(type) {
    let data;
    if (type === 'businesses') data = await getMergedBusinesses();
    if (type === 'deals') data = await getMergedDeals();
    if (type === 'reviews') data = await getMergedReviews();
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    return URL.createObjectURL(blob);
}

export function importData(jsonString, type) {
    try {
        const data = JSON.parse(jsonString);
        if (!Array.isArray(data)) throw new Error("Imported data must be an array");
        
        // Validate schema roughly
        if (data.length > 0) {
            if (type === 'businesses' && !data[0].name) throw new Error("Invalid business schema");
            if (type === 'deals' && !data[0].title) throw new Error("Invalid deal schema");
            if (type === 'reviews' && !data[0].text) throw new Error("Invalid review schema");
        }

        // Save to custom storage
        if (type === 'businesses') setLocalData('businesses_custom', data);
        if (type === 'deals') setLocalData('deals_custom', data);
        if (type === 'reviews') setLocalData('reviews_custom', data);

        return { success: true };
    } catch (e) {
        return { success: false, error: e.message };
    }
}
