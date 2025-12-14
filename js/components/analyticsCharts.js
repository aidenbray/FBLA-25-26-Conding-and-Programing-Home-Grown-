import { getMergedBusinesses, getMergedReviews, getMergedDeals } from '../services/adminDataService.js';
import { calculateBusinessStats, calculateCategoryStats } from '../services/analyticsService.js';

export async function renderAnalytics(container) {
    const businesses = await getMergedBusinesses();
    const reviews = await getMergedReviews();
    const deals = await getMergedDeals();

    const bizStats = calculateBusinessStats(businesses, reviews);
    const catStats = calculateCategoryStats(businesses);

    container.innerHTML = `
        <div class="admin-section">
            <h2>Analytics Dashboard</h2>
            <div class="analytics-grid">
                <div class="chart-container">
                    <h3>Most Reviewed Businesses</h3>
                    <canvas id="chart-reviews" width="300" height="200"></canvas>
                </div>
                <div class="chart-container">
                    <h3>Business Categories</h3>
                    <canvas id="chart-categories" width="300" height="200"></canvas>
                </div>
            </div>
        </div>
    `;

    // Simple Bar Chart for Reviews
    const ctxReviews = container.querySelector('#chart-reviews').getContext('2d');
    drawBarChart(ctxReviews, bizStats.mostReviewed.map(b => b.name), bizStats.mostReviewed.map(b => b.count));

    // Simple Pie Chart for Categories
    const ctxCats = container.querySelector('#chart-categories').getContext('2d');
    drawPieChart(ctxCats, catStats);
}

function drawBarChart(ctx, labels, data) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const maxVal = Math.max(...data, 1);
    const barWidth = (width - 40) / data.length;

    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#ff6b00';
    data.forEach((val, i) => {
        const barHeight = (val / maxVal) * (height - 40);
        ctx.fillRect(20 + i * barWidth, height - 20 - barHeight, barWidth - 10, barHeight);
        
        ctx.fillStyle = '#333';
        ctx.font = '10px Arial';
        ctx.fillText(val, 20 + i * barWidth + (barWidth-10)/2 - 3, height - 20 - barHeight - 5);
        ctx.fillText(labels[i].substring(0, 5), 20 + i * barWidth, height - 5);
        ctx.fillStyle = '#ff6b00';
    });
}

function drawPieChart(ctx, data) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const total = data.reduce((sum, item) => sum + item.count, 0);
    let startAngle = 0;
    const colors = ['#ff6b00', '#333', '#666', '#999', '#ccc'];

    data.forEach((item, i) => {
        const sliceAngle = (item.count / total) * 2 * Math.PI;
        ctx.beginPath();
        ctx.moveTo(width/2, height/2);
        ctx.arc(width/2, height/2, height/2 - 20, startAngle, startAngle + sliceAngle);
        ctx.fillStyle = colors[i % colors.length];
        ctx.fill();
        startAngle += sliceAngle;
    });
    
    // Legend
    let y = 10;
    data.forEach((item, i) => {
        ctx.fillStyle = colors[i % colors.length];
        ctx.fillRect(10, y, 10, 10);
        ctx.fillStyle = '#000';
        ctx.fillText(`${item.name} (${item.count})`, 25, y + 8);
        y += 15;
    });
}
