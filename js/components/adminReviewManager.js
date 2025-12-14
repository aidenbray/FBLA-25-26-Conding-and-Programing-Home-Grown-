import { getMergedReviews, toggleReviewVisibility, deleteReview } from '../services/adminDataService.js';

export async function renderReviewAdmin(container) {
    const reviews = await getMergedReviews();
    
    container.innerHTML = `
        <div class="admin-section">
            <h2>Manage Reviews</h2>
            <div class="admin-form-group">
                <label>Filter by Business ID:</label>
                <input type="number" id="review-filter" placeholder="Enter Business ID">
            </div>

            <table class="admin-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Biz ID</th>
                        <th>Rating</th>
                        <th>Text</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="review-table-body">
                    ${renderRows(reviews)}
                </tbody>
            </table>
        </div>
    `;

    function renderRows(reviewList) {
        return reviewList.map(r => `
            <tr>
                <td>${r.id}</td>
                <td>${r.businessId}</td>
                <td>${r.rating}</td>
                <td>${r.text.substring(0, 50)}...</td>
                <td>${r.isHidden ? '<span style="color:red">Hidden</span>' : 'Visible'}</td>
                <td class="admin-actions">
                    <button class="btn-sm btn-secondary btn-toggle" data-id="${r.id}">
                        ${r.isHidden ? 'Unhide' : 'Hide'}
                    </button>
                    <button class="btn-sm btn-danger" data-id="${r.id}">Delete</button>
                </td>
            </tr>
        `).join('');
    }

    const filterInput = container.querySelector('#review-filter');
    const tbody = container.querySelector('#review-table-body');

    filterInput.addEventListener('input', (e) => {
        const val = e.target.value;
        const filtered = val ? reviews.filter(r => r.businessId == val) : reviews;
        tbody.innerHTML = renderRows(filtered);
        attachListeners();
    });

    function attachListeners() {
        tbody.querySelectorAll('.btn-toggle').forEach(btn => {
            btn.addEventListener('click', () => {
                toggleReviewVisibility(parseInt(btn.dataset.id));
                renderReviewAdmin(container);
            });
        });

        tbody.querySelectorAll('.btn-danger').forEach(btn => {
            btn.addEventListener('click', () => {
                if(confirm('Are you sure?')) {
                    deleteReview(parseInt(btn.dataset.id));
                    renderReviewAdmin(container);
                }
            });
        });
    }

    attachListeners();
}
