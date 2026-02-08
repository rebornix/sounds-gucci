// Dashboard JavaScript - loads data and renders charts/table

let analysisData = [];

async function loadData() {
    try {
        const response = await fetch('data/index.json');
        analysisData = await response.json();
        renderDashboard();
    } catch (err) {
        console.error('Failed to load data:', err);
        document.getElementById('results-body').innerHTML = 
            '<tr><td colspan="5">Failed to load data. Run scripts/generate-index.sh first.</td></tr>';
    }
}

function renderDashboard() {
    const withScores = analysisData.filter(d => d.score !== null);
    
    // Stats
    document.getElementById('total-analyzed').textContent = withScores.length;
    
    const avgScore = withScores.length > 0 
        ? (withScores.reduce((sum, d) => sum + d.score, 0) / withScores.length).toFixed(1)
        : '-';
    document.getElementById('avg-score').textContent = avgScore;
    
    const successRate = withScores.length > 0
        ? Math.round((withScores.filter(d => d.score >= 4).length / withScores.length) * 100) + '%'
        : '-';
    document.getElementById('success-rate').textContent = successRate;
    
    const models = [...new Set(withScores.map(d => d.model))];
    document.getElementById('model-name').textContent = models.join(', ') || '-';
    
    // Charts
    renderScoreChart(withScores);
    renderCategoryChart(withScores);
    
    // Table
    renderTable(analysisData);
    
    // Setup filters
    setupFilters();
}

function renderScoreChart(data) {
    const scoreCounts = [0, 0, 0, 0, 0]; // indices 0-4 for scores 1-5
    data.forEach(d => {
        const idx = Math.floor(d.score) - 1;
        if (idx >= 0 && idx < 5) scoreCounts[idx]++;
    });
    
    const ctx = document.getElementById('score-chart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['1 - Misaligned', '2 - Weak', '3 - Partial', '4 - Good', '5 - Excellent'],
            datasets: [{
                data: scoreCounts,
                backgroundColor: [
                    '#f85149', '#db6d28', '#d29922', '#58a6ff', '#3fb950'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: '#8b949e' },
                    grid: { color: '#30363d' }
                },
                x: {
                    ticks: { color: '#8b949e' },
                    grid: { display: false }
                }
            }
        }
    });
}

function renderCategoryChart(data) {
    const categories = {
        'Excellent (5)': data.filter(d => d.score === 5).length,
        'Good (4)': data.filter(d => d.score >= 4 && d.score < 5).length,
        'Partial (3)': data.filter(d => d.score >= 3 && d.score < 4).length,
        'Weak (2)': data.filter(d => d.score >= 2 && d.score < 3).length,
        'Misaligned (1)': data.filter(d => d.score >= 1 && d.score < 2).length
    };
    
    const ctx = document.getElementById('category-chart').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(categories),
            datasets: [{
                data: Object.values(categories),
                backgroundColor: ['#3fb950', '#58a6ff', '#d29922', '#db6d28', '#f85149'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right',
                    labels: { color: '#e6edf3' }
                }
            }
        }
    });
}

function renderTable(data) {
    const tbody = document.getElementById('results-body');
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5">No data found</td></tr>';
        return;
    }
    
    tbody.innerHTML = data.map(d => `
        <tr onclick="window.location='analysis.html?pr=${d.pr}'">
            <td><a href="https://github.com/${d.repo}/pull/${d.pr}" target="_blank" onclick="event.stopPropagation()">#${d.pr}</a></td>
            <td>${d.issue ? `<a href="https://github.com/${d.repo}/issues/${d.issue}" target="_blank" onclick="event.stopPropagation()">#${d.issue}</a>` : '-'}</td>
            <td>${escapeHtml(truncate(d.prTitle || d.issueTitle, 60))}</td>
            <td>${renderScoreBadge(d.score)}</td>
            <td>${d.model || '-'}</td>
        </tr>
    `).join('');
}

function renderScoreBadge(score) {
    if (score === null) return '<span class="score-badge score-null">N/A</span>';
    const scoreClass = `score-${Math.floor(score)}`;
    const labels = { 5: 'Excellent', 4: 'Good', 3: 'Partial', 2: 'Weak', 1: 'Misaligned' };
    return `<span class="score-badge ${scoreClass}">${score}/5</span>`;
}

function setupFilters() {
    document.getElementById('score-filter').addEventListener('change', applyFilters);
    document.getElementById('sort-by').addEventListener('change', applyFilters);
}

function applyFilters() {
    const scoreFilter = document.getElementById('score-filter').value;
    const sortBy = document.getElementById('sort-by').value;
    
    let filtered = [...analysisData];
    
    // Filter
    if (scoreFilter !== 'all') {
        const targetScore = parseInt(scoreFilter);
        filtered = filtered.filter(d => Math.floor(d.score) === targetScore);
    }
    
    // Sort
    switch (sortBy) {
        case 'score-desc':
            filtered.sort((a, b) => (b.score || 0) - (a.score || 0));
            break;
        case 'score-asc':
            filtered.sort((a, b) => (a.score || 0) - (b.score || 0));
            break;
        case 'pr-desc':
            filtered.sort((a, b) => b.pr - a.pr);
            break;
        case 'pr-asc':
            filtered.sort((a, b) => a.pr - b.pr);
            break;
    }
    
    renderTable(filtered);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function truncate(str, len) {
    if (!str) return '';
    return str.length > len ? str.substring(0, len) + '...' : str;
}

// Init
document.addEventListener('DOMContentLoaded', loadData);
