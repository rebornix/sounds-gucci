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
    
    const currentAnalysis = analyses.find(a => a.experimentId === selected) || analyses[0];
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
        // Preserve active tab
        const activePanel = document.querySelector('.nav-btn.active')?.dataset.panel;
        if (activePanel) url.searchParams.set('tab', activePanel);
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
        const diffResponse = await fetch(`${basePath}/actual_fix/pr-diff.patch`);
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

    // Load trace
    try {
        const traceResponse = await fetch(`${expPath}/trace.json`);
        if (traceResponse.ok) {
            const trace = await traceResponse.json();
            document.getElementById('trace-content').innerHTML = renderTrace(trace);
        } else {
            document.getElementById('trace-content').innerHTML = '<p class="muted">No trace data available. Run <code>python3 scripts/fetch-traces.py</code> to fetch.</p>';
        }
    } catch {
        document.getElementById('trace-content').innerHTML = '<p class="muted">Failed to load trace</p>';
    }
}

function renderTrace(trace) {
    const spans = trace.spans || [];
    if (spans.length === 0) return '<p class="muted">No spans in trace</p>';

    // Find the root span and compute time range
    const times = spans
        .filter(s => s.startTime)
        .map(s => new Date(s.startTime).getTime());
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const totalDuration = maxTime - minTime || 1;

    // Build parent-child map
    const childMap = {};
    spans.forEach(s => {
        const pid = s.parentId || 'root';
        if (!childMap[pid]) childMap[pid] = [];
        childMap[pid].push(s);
    });

    // Find root spans (no parent or parent is the trace root)
    const rootId = spans.find(s => s.name === trace.name)?.id;
    const rootChildren = childMap[rootId] || childMap['root'] || spans;

    // Flatten tree in DFS order with depth
    const flatSpans = [];
    function walk(spanList, depth) {
        for (const span of spanList) {
            flatSpans.push({ ...span, depth });
            if (childMap[span.id]) {
                walk(childMap[span.id], depth + 1);
            }
        }
    }
    walk(rootChildren, 0);

    // Render timeline
    let html = `<div class="trace-header">
        <span class="trace-meta">${spans.length} spans</span>
        ${trace.latency ? `<span class="trace-meta">${trace.latency.toFixed(1)}s total</span>` : ''}
        ${trace.tags?.map(t => `<span class="trace-tag">${t}</span>`).join('') || ''}
    </div>`;

    html += '<div class="trace-spans">';
    for (const [idx, span] of flatSpans.entries()) {
        const startMs = span.startTime ? new Date(span.startTime).getTime() - minTime : 0;
        const endMs = span.endTime ? new Date(span.endTime).getTime() - minTime : startMs;
        const leftPct = (startMs / totalDuration * 100).toFixed(2);
        const widthPct = Math.max(0.5, ((endMs - startMs) / totalDuration * 100)).toFixed(2);

        const spanClass = getSpanClass(span.name);
        const indent = span.depth * 16;
        const latencyLabel = span.latency != null ? `${span.latency.toFixed(2)}s` : '';
        const hasContent = span.input || span.output;
        const spanId = `span-${idx}`;

        // Build preview text
        let preview = '';
        if (span.name === 'assistant-message' && span.output) {
            preview = span.output.substring(0, 100);
        } else if (span.name.startsWith('tool:') && span.input) {
            try {
                const args = JSON.parse(span.input);
                if (args.command) preview = args.command.substring(0, 100);
                else if (args.path) preview = args.path;
                else if (args.pattern) preview = args.pattern;
                else preview = span.input.substring(0, 100);
            } catch { preview = span.input.substring(0, 100); }
        } else if (span.name === 'user-message' && span.input) {
            preview = span.input.substring(0, 100);
        } else if (span.name.startsWith('subagent:') && span.input) {
            try {
                const args = JSON.parse(span.input);
                preview = (args.prompt || args.description || '').substring(0, 100);
            } catch { preview = span.input.substring(0, 100); }
        }

        html += `<div class="trace-span ${hasContent ? 'clickable' : ''}" ${hasContent ? `onclick="toggleSpanDetail('${spanId}')"` : ''}>
            <div class="trace-span-label" style="padding-left:${indent}px">
                <span class="trace-span-icon ${spanClass}"></span>
                <span class="trace-span-name">${escapeHtml(span.name)}</span>
                ${preview ? `<span class="trace-span-preview">${escapeHtml(preview)}</span>` : ''}
                <span class="trace-span-duration">${latencyLabel}</span>
            </div>
            <div class="trace-span-bar-container">
                <div class="trace-span-bar ${spanClass}" style="left:${leftPct}%;width:${widthPct}%"></div>
            </div>
        </div>`;

        // Expandable detail panel
        if (hasContent) {
            html += `<div id="${spanId}" class="trace-span-detail" style="display:none">`;
            if (span.input) {
                html += `<div class="trace-detail-section">
                    <div class="trace-detail-label">Input</div>
                    <pre class="trace-detail-content">${escapeHtml(span.input)}</pre>
                </div>`;
            }
            if (span.output) {
                html += `<div class="trace-detail-section">
                    <div class="trace-detail-label">Output</div>
                    <pre class="trace-detail-content">${escapeHtml(span.output)}</pre>
                </div>`;
            }
            html += '</div>';
        }
    }
    html += '</div>';

    return html;
}

function getSpanClass(name) {
    if (name.startsWith('subagent:')) return 'span-subagent';
    if (name.startsWith('tool:')) return 'span-tool';
    if (name === 'user-message') return 'span-user';
    if (name === 'assistant-message') return 'span-assistant';
    return 'span-default';
}

function escapeAttr(str) {
    return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function toggleSpanDetail(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

function setupNavigation() {
    const buttons = document.querySelectorAll('.nav-btn');
    
    // Restore tab from URL param
    const savedTab = new URLSearchParams(window.location.search).get('tab');
    if (savedTab) {
        const target = document.querySelector(`.nav-btn[data-panel="${savedTab}"]`);
        if (target) {
            buttons.forEach(b => b.classList.remove('active'));
            target.classList.add('active');
            document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
            document.getElementById(`panel-${savedTab}`).classList.add('active');
        }
    }
    
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const panelId = `panel-${btn.dataset.panel}`;
            document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
            document.getElementById(panelId).classList.add('active');
            
            // Update URL param without reload
            const url = new URL(window.location);
            url.searchParams.set('tab', btn.dataset.panel);
            history.replaceState(null, '', url);
        });
    });
}

function setupPrevNext() {
    const sameExp = allAnalyses.filter(a => a.experimentId === currentExperiment);
    const currentIndex = sameExp.findIndex(a => a.pr == currentPR);
    const activeTab = new URLSearchParams(window.location.search).get('tab') || '';
    const tabParam = activeTab ? `&tab=${activeTab}` : '';
    
    const prevLink = document.getElementById('prev-analysis');
    const nextLink = document.getElementById('next-analysis');
    
    if (currentIndex > 0) {
        const prev = sameExp[currentIndex - 1];
        prevLink.href = `analysis.html?pr=${prev.pr}&experiment=${currentExperiment}${tabParam}`;
        prevLink.textContent = `← PR #${prev.pr}`;
    } else {
        prevLink.classList.add('disabled');
    }
    
    if (currentIndex < sameExp.length - 1) {
        const next = sameExp[currentIndex + 1];
        nextLink.href = `analysis.html?pr=${next.pr}&experiment=${currentExperiment}${tabParam}`;
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
