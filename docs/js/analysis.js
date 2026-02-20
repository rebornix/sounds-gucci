// Analysis page JavaScript - loads and displays individual PR analysis

let allAnalyses = [];
let currentPR = null;
let currentExperiment = null;

async function init() {
    const params = new URLSearchParams(window.location.search);
    currentPR = params.get('pr');
    currentExperiment = params.get('experiment');
    
    if (!currentPR) {
        showError('No PR specified. Go back to dashboard.');
        return;
    }
    
    try {
        // Load index for navigation
        const indexResponse = await fetch('data/index.json');
        allAnalyses = await indexResponse.json();
        
        // Find analyses for this PR
        const prAnalyses = allAnalyses.filter(a => a.pr == currentPR);
        if (prAnalyses.length === 0) {
            showError(`Analysis for PR #${currentPR} not found.`);
            return;
        }
        
        // If no experiment specified, use the first one
        if (!currentExperiment) {
            currentExperiment = prAnalyses[0].experimentId;
        }
        
        const analysis = prAnalyses.find(a => a.experimentId === currentExperiment) || prAnalyses[0];
        
        // Render header
        renderHeader(analysis);
        
        // Build experiment selector if multiple exist
        if (prAnalyses.length > 1) {
            renderExperimentSelector(prAnalyses, currentExperiment);
        }
        
        // Load content files
        await loadContent(currentPR, currentExperiment);
        
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

function renderExperimentSelector(analyses, selected) {
    const container = document.getElementById('experiment-selector');
    if (!container) return;
    
    container.innerHTML = `
        <label>Experiment: 
            <select id="experiment-select">
                ${analyses.map(a => {
                    const parts = a.experimentId.match(/^(.+)-([a-f0-9]{7})$/);
                    const label = parts ? `${parts[1]} (${parts[2]})` : a.experimentId;
                    const sel = a.experimentId === selected ? 'selected' : '';
                    return `<option value="${a.experimentId}" ${sel}>${label}</option>`;
                }).join('')}
            </select>
        </label>
    `;
    container.style.display = 'block';
    
    document.getElementById('experiment-select').addEventListener('change', (e) => {
        currentExperiment = e.target.value;
        const url = new URL(window.location);
        url.searchParams.set('experiment', currentExperiment);
        window.location = url;
    });
}

async function loadContent(pr, experimentId) {
    const basePath = `data/analysis/${pr}`;
    const expPath = `${basePath}/${experimentId}`;
    
    // Load experiment-specific files (proposal, validation) from experiment subdirectory
    // Load shared files (issue) from PR directory
    const files = {
        'issue-content': { path: `${basePath}/issue.md`, markdown: true },
        'proposal-content': { path: `${expPath}/proposed-fix.md`, markdown: true },
        'validation-content': { path: `${expPath}/validation.md`, markdown: true }
    };
    
    for (const [elementId, config] of Object.entries(files)) {
        try {
            const response = await fetch(config.path);
            if (response.ok) {
                const content = await response.text();
                document.getElementById(elementId).innerHTML = marked.parse(content);
                // Syntax-highlight all code blocks in rendered markdown
                document.getElementById(elementId).querySelectorAll('pre code').forEach(el => {
                    hljs.highlightElement(el);
                });
            } else {
                document.getElementById(elementId).innerHTML = '<p class="muted">Content not available</p>';
            }
        } catch {
            document.getElementById(elementId).innerHTML = '<p class="muted">Failed to load content</p>';
        }
    }
    
    // Load diff separately from PR directory (shared, don't parse as markdown)
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
    // Filter to same experiment for prev/next navigation
    const sameExp = allAnalyses.filter(a => a.experimentId === currentExperiment);
    const currentIndex = sameExp.findIndex(a => a.pr == currentPR);
    
    const prevLink = document.getElementById('prev-analysis');
    const nextLink = document.getElementById('next-analysis');
    
    if (currentIndex > 0) {
        const prev = sameExp[currentIndex - 1];
        prevLink.href = `analysis.html?pr=${prev.pr}&experiment=${currentExperiment}`;
        prevLink.textContent = `← PR #${prev.pr}`;
    } else {
        prevLink.classList.add('disabled');
    }
    
    if (currentIndex < sameExp.length - 1) {
        const next = sameExp[currentIndex + 1];
        nextLink.href = `analysis.html?pr=${next.pr}&experiment=${currentExperiment}`;
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
