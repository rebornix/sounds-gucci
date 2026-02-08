// Analysis page JavaScript - loads and displays individual PR analysis

let allAnalyses = [];
let currentPR = null;

async function init() {
    const params = new URLSearchParams(window.location.search);
    currentPR = params.get('pr');
    
    if (!currentPR) {
        showError('No PR specified. Go back to dashboard.');
        return;
    }
    
    try {
        // Load index for navigation
        const indexResponse = await fetch('data/index.json');
        allAnalyses = await indexResponse.json();
        
        // Find current analysis
        const analysis = allAnalyses.find(a => a.pr == currentPR);
        if (!analysis) {
            showError(`Analysis for PR #${currentPR} not found.`);
            return;
        }
        
        // Render header
        renderHeader(analysis);
        
        // Load content files
        await loadContent(currentPR);
        
        // Setup navigation
        setupNavigation();
        setupPrevNext();
        
    } catch (err) {
        console.error('Failed to load analysis:', err);
        showError('Failed to load analysis data.');
    }
}

function renderHeader(analysis) {
    document.getElementById('page-title').textContent = `PR #${analysis.pr}: ${analysis.prTitle || 'Analysis'}`;
    document.title = `PR #${analysis.pr} - Analysis`;
    
    document.getElementById('pr-link').innerHTML = 
        `<a href="https://github.com/${analysis.repo}/pull/${analysis.pr}" target="_blank">View PR ↗</a>`;
    
    if (analysis.issue) {
        document.getElementById('issue-link').innerHTML = 
            `<a href="https://github.com/${analysis.repo}/issues/${analysis.issue}" target="_blank">Issue #${analysis.issue} ↗</a>`;
    }
    
    const badge = document.getElementById('score-badge');
    if (analysis.score !== null) {
        badge.textContent = `${analysis.score}/5`;
        badge.className = `score-badge score-${Math.floor(analysis.score)}`;
    } else {
        badge.textContent = 'Not scored';
        badge.className = 'score-badge score-null';
    }
}

async function loadContent(pr) {
    const basePath = `data/analysis/${pr}`;
    
    // Load each file
    const files = {
        'issue-content': 'issue.md',
        'proposal-content': 'proposed-fix.md',
        'validation-content': 'validation.md'
    };
    
    for (const [elementId, filename] of Object.entries(files)) {
        try {
            const response = await fetch(`${basePath}/${filename}`);
            if (response.ok) {
                const content = await response.text();
                document.getElementById(elementId).innerHTML = marked.parse(content);
            } else {
                document.getElementById(elementId).innerHTML = '<p class="muted">Content not available</p>';
            }
        } catch {
            document.getElementById(elementId).innerHTML = '<p class="muted">Failed to load content</p>';
        }
    }
    
    // Load diff separately (don't parse as markdown)
    try {
        const diffResponse = await fetch(`${basePath}/pr-diff.patch`);
        if (diffResponse.ok) {
            const diff = await diffResponse.text();
            document.getElementById('diff-content').textContent = diff;
            hljs.highlightElement(document.getElementById('diff-content'));
        } else {
            document.getElementById('diff-content').textContent = 'Diff not available';
        }
    } catch {
        document.getElementById('diff-content').textContent = 'Failed to load diff';
    }
}

function setupNavigation() {
    const buttons = document.querySelectorAll('.nav-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active button
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Show corresponding panel
            const panelId = `panel-${btn.dataset.panel}`;
            document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
            document.getElementById(panelId).classList.add('active');
        });
    });
}

function setupPrevNext() {
    const currentIndex = allAnalyses.findIndex(a => a.pr == currentPR);
    
    const prevLink = document.getElementById('prev-analysis');
    const nextLink = document.getElementById('next-analysis');
    
    if (currentIndex > 0) {
        const prev = allAnalyses[currentIndex - 1];
        prevLink.href = `analysis.html?pr=${prev.pr}`;
        prevLink.textContent = `← PR #${prev.pr}`;
    } else {
        prevLink.classList.add('disabled');
    }
    
    if (currentIndex < allAnalyses.length - 1) {
        const next = allAnalyses[currentIndex + 1];
        nextLink.href = `analysis.html?pr=${next.pr}`;
        nextLink.textContent = `PR #${next.pr} →`;
    } else {
        nextLink.classList.add('disabled');
    }
}

function showError(message) {
    document.getElementById('page-title').textContent = 'Error';
    document.getElementById('panel-issue').innerHTML = `<p>${message}</p>`;
    document.getElementById('panel-issue').classList.add('active');
}

// Init
document.addEventListener('DOMContentLoaded', init);
