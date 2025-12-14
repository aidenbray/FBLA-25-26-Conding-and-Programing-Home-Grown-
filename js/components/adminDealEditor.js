import { getMergedDeals, saveDeal, deleteDeal } from '../services/adminDataService.js';

export async function renderDealAdmin(container) {
    const deals = await getMergedDeals();
    
    container.innerHTML = `
        <div class="admin-section">
            <h2>Manage Deals</h2>
            <button id="add-deal-btn" class="btn btn-primary" style="margin-bottom: 1rem;">+ Add Deal</button>
            
            <div id="deal-form-container" style="display:none; margin-bottom: 2rem; padding: 1rem; border: 1px solid #ddd;">
                <h3 id="deal-form-title">Add/Edit Deal</h3>
                <form id="deal-form">
                    <input type="hidden" id="deal-id">
                    <div class="admin-form-group">
                        <label>Business ID</label>
                        <input type="number" id="deal-biz-id" required>
                    </div>
                    <div class="admin-form-group">
                        <label>Title</label>
                        <input type="text" id="deal-title" required>
                    </div>
                    <div class="admin-form-group">
                        <label>Description</label>
                        <textarea id="deal-desc" required></textarea>
                    </div>
                    <div class="admin-form-group">
                        <label>Start Date</label>
                        <input type="date" id="deal-start" required>
                    </div>
                    <div class="admin-form-group">
                        <label>End Date</label>
                        <input type="date" id="deal-end" required>
                    </div>
                    <button type="submit" class="btn btn-primary">Save</button>
                    <button type="button" id="cancel-deal-btn" class="btn btn-secondary">Cancel</button>
                </form>
                <div id="deal-error" class="error-message"></div>
            </div>

            <table class="admin-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Business ID</th>
                        <th>Title</th>
                        <th>Dates</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="deal-table-body">
                    ${deals.map(d => `
                        <tr>
                            <td>${d.id}</td>
                            <td>${d.businessId}</td>
                            <td>${d.title}</td>
                            <td>${d.startDate} to ${d.endDate}</td>
                            <td class="admin-actions">
                                <button class="btn-sm btn-edit" data-id="${d.id}">Edit</button>
                                <button class="btn-sm btn-danger" data-id="${d.id}">Delete</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;

    const formContainer = container.querySelector('#deal-form-container');
    const form = container.querySelector('#deal-form');
    const addBtn = container.querySelector('#add-deal-btn');
    const cancelBtn = container.querySelector('#cancel-deal-btn');
    const errorDiv = container.querySelector('#deal-error');

    addBtn.addEventListener('click', () => {
        form.reset();
        container.querySelector('#deal-id').value = '';
        container.querySelector('#deal-form-title').textContent = 'Add Deal';
        formContainer.style.display = 'block';
    });

    cancelBtn.addEventListener('click', () => {
        formContainer.style.display = 'none';
        errorDiv.textContent = '';
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = container.querySelector('#deal-id').value;
        const businessId = parseInt(container.querySelector('#deal-biz-id').value);
        const title = container.querySelector('#deal-title').value;
        const description = container.querySelector('#deal-desc').value;
        const startDate = container.querySelector('#deal-start').value;
        const endDate = container.querySelector('#deal-end').value;

        if (new Date(endDate) < new Date(startDate)) {
            errorDiv.textContent = "End date must be after start date.";
            return;
        }

        const newDeal = {
            id: id ? parseInt(id) : Date.now(),
            businessId,
            title,
            description,
            startDate,
            endDate
        };

        saveDeal(newDeal);
        renderDealAdmin(container);
    });

    container.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            const deal = deals.find(d => d.id === id);
            if (deal) {
                container.querySelector('#deal-id').value = deal.id;
                container.querySelector('#deal-biz-id').value = deal.businessId;
                container.querySelector('#deal-title').value = deal.title;
                container.querySelector('#deal-desc').value = deal.description;
                container.querySelector('#deal-start').value = deal.startDate;
                container.querySelector('#deal-end').value = deal.endDate;
                container.querySelector('#deal-form-title').textContent = 'Edit Deal';
                formContainer.style.display = 'block';
            }
        });
    });

    container.querySelectorAll('.btn-danger').forEach(btn => {
        btn.addEventListener('click', () => {
            if(confirm('Are you sure?')) {
                deleteDeal(parseInt(btn.dataset.id));
                renderDealAdmin(container);
            }
        });
    });
}
