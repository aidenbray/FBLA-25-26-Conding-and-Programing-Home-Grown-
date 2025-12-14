export function calculateBusinessStats(businesses, reviews) {
    // Most reviewed businesses
    const reviewCounts = {};
    reviews.forEach(r => {
        reviewCounts[r.businessId] = (reviewCounts[r.businessId] || 0) + 1;
    });

    const mostReviewed = businesses.map(b => ({
        name: b.name,
        count: reviewCounts[b.id] || 0
    })).sort((a, b) => b.count - a.count).slice(0, 5);

    // Highest credibility (rating)
    const highestRated = businesses.map(b => ({
        name: b.name,
        rating: b.rating
    })).sort((a, b) => b.rating - a.rating).slice(0, 5);

    return { mostReviewed, highestRated };
}

export function calculateReviewStats(reviews) {
    // Just total count for now or distribution
    return { total: reviews.length };
}

export function calculateDealStats(deals) {
    // Active deals count
    const now = new Date();
    const active = deals.filter(d => new Date(d.endDate) >= now).length;
    return { active, total: deals.length };
}

export function calculateCategoryStats(businesses) {
    const counts = {};
    businesses.forEach(b => {
        counts[b.category] = (counts[b.category] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
}
