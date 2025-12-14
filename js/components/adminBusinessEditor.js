import { getMergedBusinesses, saveBusiness, deleteBusiness } from '../services/adminDataService.js';

export async function renderBusinessAdmin(container) {
    const businesses = await getMergedBusinesses();
    
    container.innerHTML = `
        <div class="admin-section">
            <h2>Manage Businesses</h2>
            <button id="add-business-btn" class="btn btn-primary" style="margin-bottom: 1rem;">+ Add Business</button>
            
            <div id="business-form-container" style="display:none; margin-bottom: 2rem; padding: 1rem; border: 1px solid #ddd;">
                <h3 id="form-title">Add/Edit Business</h3>
                <form id="business-form">
                    <input type="hidden" id="biz-id">
                    <div class="admin-form-group">
                        <label>Name</label>
                        <input type="text" id="biz-name" required>
                    </div>
                    <div class="admin-form-group">
                        <label>Category</label>
                        <input type="text" id="biz-category" required>
                    </div>
                    <div class="admin-form-group">
                        <label>Rating (0-5)</label>
                        <input type="number" id="biz-rating" min="0" max="5" step="0.1" required>
                    </div>
                    <div class="admin-form-group">
                        <label>Description</label>
                        <textarea id="biz-desc" required minlength="5"></textarea>
                    </div>
                    <div class="admin-form-group">
                        <label>Image Filename</label>
                        <input type="text" id="biz-image" value="placeholder.jpg">
                    </div>
                    <button type="submit" class="btn btn-primary">Save</button>
                    <button type="button" id="cancel-biz-btn" class="btn btn-secondary">Cancel</button>
                </form>
                <div id="biz-error" class="error-message"></div>
            </div>

            <table class="admin-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Category</th>
                        <th>Rating</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="business-table-body">
                    ${businesses.map(b => `
                        <tr>
                            <td>${b.id}</td>
                            <td>${b.name}</td>
                            <td>${b.category}</td>
                            <td>${b.rating}</td>
                            <td class="admin-actions">
                                <button class="btn-sm btn-edit" data-id="${b.id}">Edit</button>
                                <button class="btn-sm btn-danger" data-id="${b.id}">Delete</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;

    // Event Listeners
    const formContainer = container.querySelector('#business-form-container');
    const form = container.querySelector('#business-form');
    const addBtn = container.querySelector('#add-business-btn');
    const cancelBtn = container.querySelector('#cancel-biz-btn');
    const errorDiv = container.querySelector('#biz-error');

    addBtn.addEventListener('click', () => {
        form.reset();
        container.querySelector('#biz-id').value = '';
        container.querySelector('#form-title').textContent = 'Add Business';
        formContainer.style.display = 'block';
    });

    cancelBtn.addEventListener('click', () => {
        formContainer.style.display = 'none';
        errorDiv.textContent = '';
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = container.querySelector('#biz-id').value;
        const name = container.querySelector('#biz-name').value;
        const category = container.querySelector('#biz-category').value;
        const rating = parseFloat(container.querySelector('#biz-rating').value);
        const description = container.querySelector('#biz-desc').value;
        const image = container.querySelector('#biz-image').value;

        if (description.length < 5) {
            errorDiv.textContent = "Description must be at least 5 characters.";
            return;
        }

        const newBiz = {
            id: id ? parseInt(id) : Date.now(), // Simple ID generation
            name,
            category,
            rating,
            description,
            image
        };

        saveBusiness(newBiz);
        renderBusinessAdmin(container); // Re-render
    });

    container.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            const biz = businesses.find(b => b.id === id);
            if (biz) {
                container.querySelector('#biz-id').value = biz.id;
                container.querySelector('#biz-name').value = biz.name;
                container.querySelector('#biz-category').value = biz.category;
                container.querySelector('#biz-rating').value = biz.rating;
                container.querySelector('#biz-desc').value = biz.description;
                container.querySelector('#biz-image').value = biz.image;
                container.querySelector('#form-title').textContent = 'Edit Business';
                formContainer.style.display = 'block';
            }
        });
    });

    container.querySelectorAll('.btn-danger').forEach(btn => {
        btn.addEventListener('click', () => {
            if(confirm('Are you sure?')) {
                deleteBusiness(parseInt(btn.dataset.id));
                renderBusinessAdmin(container);
            }
        });
    });
}
