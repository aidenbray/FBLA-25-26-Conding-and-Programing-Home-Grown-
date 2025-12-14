import { calculateCredibility } from '../services/credibilityService.js'
import { formatDateHuman } from '../utils/dateUtils.js'

export function renderReviewCard(review) {
    const card = document.createElement('div');
    card.className = 'review-card';
    
    // Lazy load image
    const imgUrl = review.image ? (review.image.startsWith('http') ? review.image : `assets/${review.image}`) : null
    const img = imgUrl ? `<img data-src="${imgUrl}" alt="Review Image" class="review-image lazy-load" loading="lazy">` : '';

    card.innerHTML = `
        <div class="review-header">
            <div class="review-rating">
                ${'★'.repeat(Math.floor(review.rating))}${'☆'.repeat(5 - Math.floor(review.rating))}
            </div>
            <span class="review-date">${new Date(review.date).toLocaleDateString()}</span>
        </div>
        <p class="review-text">"${review.text}"</p>
        ${img}
        <div class="review-footer">
            <button class="btn-like" data-id="${review.id}">
                ❤️ <span class="like-count">${review.likes || 0}</span>
            </button>
            <button class="btn-comment" data-id="${review.id}">💬 Comment</button>
        </div>
        <div class="comments-section" id="comments-${review.id}">
            ${(review.comments || []).map(c => `<div class="comment">${c}</div>`).join('')}
        </div>
    `;

    // Intersection Observer for lazy loading
    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const imgEl = entry.target;
                imgEl.src = imgEl.dataset.src;
                imgEl.classList.remove('lazy-load');
                obs.unobserve(imgEl);
            }
        });
    });

    const lazyImg = card.querySelector('.lazy-load');
    if (lazyImg) observer.observe(lazyImg);

    return card;
}
