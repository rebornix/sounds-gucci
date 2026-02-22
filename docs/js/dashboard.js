// Dashboard JavaScript - loads data and renders charts/table

let analysisData = [];
let currentExperiment = 'all';
let currentTag = 'all';
let scoreChart = null;
let categoryChart = null;

async function loadData() {
    try {
        const response = await fetch('data/index.json');
        analysisData = await response.json();
        
        // Check URL for experiment param
        const params = new URLSearchParams(window.location.search);
        if (params.get('experiment')) {
            currentExperiment = params.get('experiment');
        }
        if (params.get('tag')) {
            currentTag = params.get('tag');
        }
        
        populateExperimentFilter();
        populateTagFilter();
        renderDashboard();
    } catch (err) {
        console.error('Failed to load data:', err);
        document.getElementById('results-body').innerHTML = 
            '<tr><td colspan="6">Failed to load data. Run scripts/generate-index.sh first.</td></tr>';
    }
}

function populateExperimentFilter() {
    const select = document.getElementById('experiment-filter');
    const experiments = [...new Set(analysisData.map(d => d.experimentId))].sort();
    
    experiments.forEach(exp => {
        const opt = document.createElement('option');
        opt.value = exp;
        opt.textContent = exp;
        if (exp === currentExperiment) opt.selected = true;
        select.appendChild(opt);
    });
    
    // Default to 'all' if none specified
    if (currentExperiment === 'all') {
        select.value = 'all';
    }
}

function populateTagFilter() {
    const select = document.getElementById('tag-filter');
    const tags = [...new Set(analysisData.flatMap(d => d.tags || []))].sort();
    
    tags.forEach(tag => {
        const opt = document.createElement('option');
        opt.value = tag;
        opt.textContent = tag;
        if (tag === currentTag) opt.selected = true;
        select.appendChild(opt);
    });
    
    if (currentTag === 'all') {
        select.value = 'all';
    }
    
    select.addEventListener('change', () => {
        currentTag = select.value;
        renderDashboard();
    });
}

function renderSingleStats(withScores) {
    const statsSection = document.getElementById('stats');
    statsSection.className = 'stats-grid';
    statsSection.innerHTML = `
        <div class="stat-card">
            <div class="stat-value">${withScores.length}</div>
            <div class="stat-label">PRs Analyzed</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${withScores.length > 0 ? (withScores.reduce((s,d) => s+d.score, 0) / withScores.length).toFixed(1) : '-'}</div>
            <div class="stat-label">Avg Score</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${withScores.length > 0 ? Math.round((withScores.filter(d => d.score >= 4).length / withScores.length) * 100) + '%' : '-'}</div>
            <div class="stat-label">Success Rate (4+)</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${[...new Set(withScores.map(d => d.model))].join(', ') || '-'}</div>
            <div class="stat-label">Model</div>
        </div>
    `;
}

function renderComparisonStats(withScores) {
    const statsSection = document.getElementById('stats');
    statsSection.className = 'stats-comparison';
    statsSection.innerHTML = '';
}

function getFilteredData() {
    let data = analysisData;
    if (currentTag !== 'all') {
        data = data.filter(d => (d.tags || []).includes(currentTag));
    }
    if (currentExperiment !== 'all') {
        data = data.filter(d => d.experimentId === currentExperiment);
    }
    return data;
}

function renderDashboard() {
    const data = getFilteredData();
    const withScores = data.filter(d => d.score !== null);
    
    // Stats
    if (currentExperiment === 'all') {
        renderComparisonStats(withScores);
    } else {
        renderSingleStats(withScores);
    }
    
    // Charts (destroy old ones first)
    if (scoreChart) scoreChart.destroy();
    if (categoryChart) categoryChart.destroy();
    
    const globalMaxY = getGlobalScoreMax();
    
    if (currentExperiment === 'all') {
        scoreChart = renderComparisonChart(globalMaxY);
        categoryChart = renderCategoryChart(withScores);
    } else {
        scoreChart = renderScoreChart(withScores, globalMaxY);
        categoryChart = renderCategoryChart(withScores);
    }
    
    // Table (apply current sort/filter)
    applyFilters();
    
    // Setup filters
    setupFilters();
    
    // Update URL
    const url = new URL(window.location);
    if (currentExperiment !== 'all') {
        url.searchParams.set('experiment', currentExperiment);
    } else {
        url.searchParams.delete('experiment');
    }
    if (currentTag !== 'all') {
        url.searchParams.set('tag', currentTag);
    } else {
        url.searchParams.delete('tag');
    }
    history.replaceState(null, '', url);
}

function getGlobalScoreMax() {
    const data = getFilteredData();
    const experiments = [...new Set(data.map(d => d.experimentId))];
    let maxCount = 0;
    for (const exp of experiments) {
        const counts = [0, 0, 0, 0, 0];
        data.filter(d => d.experimentId === exp && d.score).forEach(d => {
            const idx = Math.floor(d.score) - 1;
            if (idx >= 0 && idx < 5) counts[idx]++;
        });
        maxCount = Math.max(maxCount, ...counts);
    }
    return maxCount;
}

function renderComparisonChart(maxY) {
    const data = getFilteredData();
    const experiments = [...new Set(data.map(d => d.experimentId))].sort();
    const colors = ['#58a6ff', '#3fb950', '#d29922', '#f778ba', '#db6d28'];
    
    const datasets = experiments.map((exp, i) => {
        const counts = [0, 0, 0, 0, 0];
        data.filter(d => d.experimentId === exp && d.score).forEach(d => {
            const idx = Math.floor(d.score) - 1;
            if (idx >= 0 && idx < 5) counts[idx]++;
        });
        const label = exp.replace(/-\d{4}-\d{2}-\d{2}$/, '').replace(/-[a-f0-9]{7}$/, '');
        return {
            label,
            data: counts,
            backgroundColor: colors[i % colors.length],
            borderWidth: 0
        };
    });
    
    const ctx = document.getElementById('score-chart').getContext('2d');
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['1 - Misaligned', '2 - Weak', '3 - Partial', '4 - Good', '5 - Excellent'],
            datasets
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true,
                    labels: { color: '#e6edf3' }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: maxY > 0 ? maxY : undefined,
                    ticks: { color: '#8b949e', stepSize: 1 },
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

function renderScoreChart(data, maxY) {
    const scoreCounts = [0, 0, 0, 0, 0]; // indices 0-4 for scores 1-5
    data.forEach(d => {
        const idx = Math.floor(d.score) - 1;
        if (idx >= 0 && idx < 5) scoreCounts[idx]++;
    });
    
    const ctx = document.getElementById('score-chart').getContext('2d');
    return new Chart(ctx, {
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
                    max: maxY > 0 ? maxY : undefined,
                    ticks: { color: '#8b949e', stepSize: 1 },
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
    return new Chart(ctx, {
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
    const thead = document.querySelector('#results-table thead tr');
    
    if (data.length === 0) {
        thead.innerHTML = '<th>PR</th><th>Issue</th><th>Title</th><th>Score</th><th>Tags</th><th>Model</th>';
        tbody.innerHTML = '<tr><td colspan="6">No data found</td></tr>';
        return;
    }
    
    if (currentExperiment === 'all') {
        renderComparisonTable(data, thead, tbody);
    } else {
        renderSingleTable(data, thead, tbody);
    }
}

function renderSingleTable(data, thead, tbody) {
    thead.innerHTML = '<th>PR</th><th>Issue</th><th>Title</th><th>Score</th><th>Tags</th><th>Model</th>';
    tbody.innerHTML = data.map(d => {
        const tags = (d.tags || []).map(t => `<span class="tag-badge">${escapeHtml(t)}</span>`).join(' ');
        return `
        <tr onclick="window.location='analysis.html?pr=${d.pr}&experiment=${d.experimentId}'">
            <td><a href="https://github.com/${d.repo}/pull/${d.pr}" target="_blank" onclick="event.stopPropagation()">#${d.pr}</a></td>
            <td>${d.issue ? `<a href="https://github.com/${d.repo}/issues/${d.issue}" target="_blank" onclick="event.stopPropagation()">#${d.issue}</a>` : '-'}</td>
            <td>${escapeHtml(truncate(d.prTitle || d.issueTitle, 60))}</td>
            <td>${renderScoreBadge(d.score)}</td>
            <td>${tags}</td>
            <td>${d.model || '-'}</td>
        </tr>`;
    }).join('');
}

function renderComparisonTable(data, thead, tbody) {
    const experiments = [...new Set(data.map(d => d.experimentId))].sort();
    const modelLabels = experiments.map(exp => 
        exp.replace(/-\d{4}-\d{2}-\d{2}$/, '').replace(/-[a-f0-9]{7}$/, '')
    );
    
    thead.innerHTML = '<th>PR</th><th>Issue</th><th>Title</th><th>Tags</th>' + 
        modelLabels.map(m => `<th>${escapeHtml(m)}</th>`).join('');
    
    // Group by PR
    const byPR = new Map();
    data.forEach(d => {
        if (!byPR.has(d.pr)) {
            byPR.set(d.pr, { pr: d.pr, issue: d.issue, repo: d.repo, title: d.prTitle || d.issueTitle, tags: d.tags || [], scores: {} });
        }
        byPR.get(d.pr).scores[d.experimentId] = d;
    });
    
    tbody.innerHTML = [...byPR.values()].map(row => {
        const firstExp = experiments.find(e => row.scores[e]) || experiments[0];
        const tags = (row.tags || []).map(t => `<span class="tag-badge">${escapeHtml(t)}</span>`).join(' ');
        const scoreCells = experiments.map(exp => {
            const d = row.scores[exp];
            if (!d) return '<td>-</td>';
            return `<td onclick="event.stopPropagation(); window.location='analysis.html?pr=${row.pr}&experiment=${exp}'" style="cursor:pointer">${renderScoreBadge(d.score)}</td>`;
        }).join('');
        return `
        <tr onclick="window.location='analysis.html?pr=${row.pr}&experiment=${firstExp}'" style="cursor:pointer">
            <td><a href="https://github.com/${row.repo}/pull/${row.pr}" target="_blank" onclick="event.stopPropagation()">#${row.pr}</a></td>
            <td>${row.issue ? `<a href="https://github.com/${row.repo}/issues/${row.issue}" target="_blank" onclick="event.stopPropagation()">#${row.issue}</a>` : '-'}</td>
            <td>${escapeHtml(truncate(row.title, 60))}</td>
            <td>${tags}</td>
            ${scoreCells}
        </tr>`;
    }).join('');
}

function renderScoreBadge(score) {
    if (score === null) return '<span class="score-badge score-null">N/A</span>';
    const scoreClass = `score-${Math.floor(score)}`;
    const labels = { 5: 'Excellent', 4: 'Good', 3: 'Partial', 2: 'Weak', 1: 'Misaligned' };
    return `<span class="score-badge ${scoreClass}">${score}/5</span>`;
}

function setupFilters() {
    document.getElementById('experiment-filter').addEventListener('change', onExperimentChange);
    document.getElementById('score-filter').addEventListener('change', applyFilters);
    document.getElementById('sort-by').addEventListener('change', applyFilters);
}

function onExperimentChange() {
    currentExperiment = document.getElementById('experiment-filter').value;
    renderDashboard();
}

function applyFilters() {
    const scoreFilter = document.getElementById('score-filter').value;
    const sortBy = document.getElementById('sort-by').value;
    
    let filtered = [...getFilteredData()];
    
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
