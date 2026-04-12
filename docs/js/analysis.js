// Analysis page JavaScript - loads and displays individual PR analysis

let allAnalyses = [];
let currentAnalysisId = null;
let currentExperiment = null;
let currentAnalysis = null;

async function init() {
    const params = new URLSearchParams(window.location.search);
    currentAnalysisId = params.get('analysis') || params.get('pr');
    currentExperiment = params.get('experiment');
    
    if (!currentAnalysisId) {
        showError('No analysis specified. Go back to dashboard.');
        return;
    }
    
    try {
        // Load index for navigation
        const indexResponse = await fetch('data/index.json');
        allAnalyses = await indexResponse.json();
        
        // Find analyses for this analysis directory.
        const prAnalyses = allAnalyses.filter(a => String(a.analysisId || a.pr) === String(currentAnalysisId));
        if (prAnalyses.length === 0) {
            showError(`Analysis ${currentAnalysisId} not found.`);
            return;
        }
        
        // If no experiment specified, use the first one
        if (!currentExperiment) {
            currentExperiment = prAnalyses[0].experimentId;
        }
        
        const analysis = prAnalyses.find(a => a.experimentId === currentExperiment) || prAnalyses[0];
        currentAnalysis = analysis;
        
        // Render header
        renderHeader(analysis);
        
        // Build experiment selector if multiple exist
        if (prAnalyses.length > 1) {
            renderExperimentSelector(prAnalyses, currentExperiment);
        }
        
        // Load content files
        await loadContent(currentAnalysisId, currentExperiment, analysis);
        
        // Setup navigation
        setupNavigation();
        setupPrevNext();
        
    } catch (err) {
        console.error('Failed to load analysis:', err);
        showError('Failed to load analysis data.');
    }
}

function renderHeader(analysis) {
    const title = getDisplayTitle(analysis);
    const titlePrefix = analysis.issue ? `Issue #${analysis.issue} / PR #${analysis.pr}` : `PR #${analysis.pr}`;
    document.getElementById('page-title').textContent = `${titlePrefix}: ${title || 'Analysis'}`;
    document.title = `${titlePrefix} - Analysis`;
    
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
        url.searchParams.set('analysis', currentAnalysisId);
        // Preserve active tab
        const activePanel = document.querySelector('.nav-btn.active')?.dataset.panel;
        if (activePanel) url.searchParams.set('tab', activePanel);
        window.location = url;
    });
}

async function loadContent(analysisId, experimentId, analysis) {
    const basePath = `data/analysis/${analysisId}`;
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

    await loadTrace(expPath, analysis);
}

async function loadTrace(expPath, analysis) {
    const traceContainer = document.getElementById('trace-content');
    let traceMeta = null;

    try {
        const metaResponse = await fetch(`${expPath}/trace-metadata.json`);
        if (metaResponse.ok) {
            traceMeta = await metaResponse.json();
        }
    } catch {
        // Best effort only; older experiments won't have trace metadata.
    }

    try {
        const traceResponse = await fetch(`${expPath}/trace.json`);
        if (traceResponse.ok) {
            const trace = await traceResponse.json();
            traceContainer.innerHTML = renderTraceSummary(traceMeta, analysis) + renderTrace(trace);
            return;
        }
    } catch (err) {
        console.error('Failed to load trace payload:', err);
    }

    traceContainer.innerHTML = renderTraceUnavailable(traceMeta, analysis);
}

function getTraceState(traceMeta, analysis) {
    const status = traceMeta?.status || analysis?.traceStatus || 'missing';
    const source = traceMeta?.source?.kind || analysis?.traceSource || '';
    const traceIds = traceMeta?.source?.traceIds || [];
    const spanCount = traceMeta?.spanCount ?? analysis?.traceSpanCount ?? 0;
    const timeWindow = traceMeta?.window || null;
    const phases = traceMeta?.phases || [];

    let note = traceMeta?.note || '';
    if (!note) {
        if (source === 'local' || status === 'available') {
            note = 'Rendered from a stored trace.json file.';
        } else if (status === 'partial') {
            note = 'Only a parent/root trace was available for this run.';
        } else {
            note = 'No trace was captured for this experiment.';
        }
    }

    return {
        status,
        source,
        traceIds,
        spanCount,
        note,
        timeWindow,
        phases,
    };
}

function renderTraceSummary(traceMeta, analysis) {
    const state = getTraceState(traceMeta, analysis);
    const badgeClass = `trace-status-badge trace-status-${state.status}`;
    const traceIdHtml = state.traceIds.length > 0
        ? `<div class="trace-status-detail"><strong>Trace IDs:</strong> ${state.traceIds.map(id => `<span class="trace-tag" title="${escapeHtml(id)}">${escapeHtml(id.slice(0, 12))}</span>`).join(' ')}</div>`
        : '';
    const windowHtml = state.timeWindow?.start && state.timeWindow?.end
        ? `<div class="trace-status-detail"><strong>Window:</strong> ${escapeHtml(state.timeWindow.start)} to ${escapeHtml(state.timeWindow.end)}</div>`
        : '';
    const spanHtml = state.spanCount > 0
        ? `<div class="trace-status-detail"><strong>Normalized spans:</strong> ${state.spanCount}</div>`
        : '';
    const phaseHtml = state.phases.length > 0
        ? `<div class="trace-status-detail"><strong>Sessions:</strong> ${state.phases.map(p => `<span class="trace-tag">${escapeHtml(p)}</span>`).join(' ')}</div>`
        : '';
    const sourceHtml = state.source
        ? `<div class="trace-status-detail"><strong>Source:</strong> ${escapeHtml(state.source)}</div>`
        : '';

    return `<div class="trace-status-card">
        <div class="trace-status-header">
            <span class="${badgeClass}">${escapeHtml(state.status)}</span>
            ${sourceHtml}
            ${spanHtml}
            ${phaseHtml}
        </div>
        <p class="trace-status-note">${escapeHtml(state.note)}</p>
        ${traceIdHtml}
        ${windowHtml}
    </div>`;
}

function renderTraceUnavailable(traceMeta, analysis) {
    const state = getTraceState(traceMeta, analysis);
    let message = 'No trace data is available for this experiment.';
    if (state.status === 'missing') {
        message = 'No Tempo trace was captured for this run. Re-run the analysis if you want a renderable trace.';
    } else if (state.status === 'partial') {
        message = 'Trace metadata exists, but the normalized trace payload is missing. Re-run the Tempo exporter to rebuild trace.json.';
    }
    return renderTraceSummary(traceMeta, analysis) + `<p class="muted">${escapeHtml(message)}</p>`;
}

// ---------------------------------------------------------------------------
// OTEL span helpers — extract display info from native attributes
// ---------------------------------------------------------------------------

/** Convert OTEL attributes array to a flat key→value map. */
function attrMap(span) {
    const attrs = {};
    for (const entry of (span.attributes || [])) {
        if (!entry.key) continue;
        const val = entry.value;
        attrs[entry.key] = val?.stringValue ?? val?.intValue ?? val?.boolValue ?? String(Object.values(val || {})[0] ?? '');
    }
    return attrs;
}

/** Derive a display name from an OTEL span. */
function spanDisplayName(span, attrs) {
    // Legacy format already has normalized names
    if (span.id && !span.spanId) return span.name;
    // Phase-labeled session spans
    if (attrs['analysis.phase']) return `session:${attrs['analysis.phase']}`;
    const agentName = attrs['gen_ai.agent.name'];
    if (agentName) return `subagent:${agentName}`;
    const toolName = attrs['gen_ai.tool.name'];
    if (toolName) return `tool:${toolName}`;
    return span.name || attrs['gen_ai.operation.name'] || 'span';
}

/** Extract input text from OTEL attributes. */
function spanInput(span, attrs) {
    // Legacy format
    if ('input' in span) return span.input;
    return attrs['gen_ai.tool.call.arguments'] || attrs['gen_ai.input.messages'] || null;
}

/** Extract output text from OTEL attributes. */
function spanOutput(span, attrs) {
    // Legacy format
    if ('output' in span) return span.output;
    return attrs['gen_ai.tool.call.result'] || attrs['gen_ai.output.messages'] || null;
}

/** Get the span's unique ID (supports both old and OTEL formats). */
function spanId(span) {
    return span.spanId || span.id;
}

/** Get the span's parent ID (supports both old and OTEL formats). */
function spanParentId(span) {
    return span.parentSpanId ?? span.parentId ?? null;
}

/** Convert nanos timestamp to milliseconds, or parse ISO string. */
function spanStartMs(span) {
    if (span.startTimeUnixNano) return Number(BigInt(span.startTimeUnixNano) / 1_000_000n);
    if (span.startTime) return new Date(span.startTime).getTime();
    return null;
}

function spanEndMs(span) {
    if (span.endTimeUnixNano) return Number(BigInt(span.endTimeUnixNano) / 1_000_000n);
    if (span.endTime) return new Date(span.endTime).getTime();
    return null;
}

/** Compute latency in seconds from an OTEL span. */
function spanLatency(span) {
    if (span.latency != null) return span.latency;
    const start = spanStartMs(span);
    const end = spanEndMs(span);
    if (start != null && end != null) return (end - start) / 1000;
    return null;
}

/** Build a short preview string for a span. */
function spanPreview(displayName, input, output) {
    if (displayName === 'assistant-message' && output) {
        return output.substring(0, 100);
    }
    if (displayName.startsWith('tool:') && input) {
        try {
            const args = JSON.parse(input);
            if (args.command) return args.command.substring(0, 100);
            if (args.path) return args.path;
            if (args.pattern) return args.pattern;
            return input.substring(0, 100);
        } catch { return input.substring(0, 100); }
    }
    if (displayName === 'user-message' && input) {
        return input.substring(0, 100);
    }
    if (displayName.startsWith('subagent:') && input) {
        try {
            const args = JSON.parse(input);
            return (args.prompt || args.description || '').substring(0, 100);
        } catch { return input.substring(0, 100); }
    }
    return '';
}

// ---------------------------------------------------------------------------
// Trace rendering
// ---------------------------------------------------------------------------

function renderTrace(trace) {
    const spans = trace.spans || [];
    if (spans.length === 0) return '<p class="muted">No spans in trace</p>';

    // Compute time range from all spans
    const times = spans.map(s => spanStartMs(s)).filter(t => t != null);
    const endTimes = spans.map(s => spanEndMs(s)).filter(t => t != null);
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times, ...endTimes);
    const totalDuration = maxTime - minTime || 1;

    // Build parent-child map
    const childMap = {};
    spans.forEach(s => {
        const pid = spanParentId(s) || 'root';
        if (!childMap[pid]) childMap[pid] = [];
        childMap[pid].push(s);
    });

    // Find root spans
    const rootSpanId = spans.find(s => s.name === trace.name)
        ? spanId(spans.find(s => s.name === trace.name))
        : null;
    const rootChildren = childMap[rootSpanId] || childMap['root'] || spans;

    // Flatten tree in DFS order with depth
    const flatSpans = [];
    function walk(spanList, depth) {
        for (const span of spanList) {
            flatSpans.push({ span, depth });
            const children = childMap[spanId(span)];
            if (children) walk(children, depth + 1);
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
    for (const [idx, { span, depth }] of flatSpans.entries()) {
        const attrs = attrMap(span);
        const displayName = spanDisplayName(span, attrs);
        const input = spanInput(span, attrs);
        const output = spanOutput(span, attrs);
        const latency = spanLatency(span);

        const startMs = (spanStartMs(span) || minTime) - minTime;
        const endMs = (spanEndMs(span) || (spanStartMs(span) || minTime)) - minTime;
        const leftPct = (startMs / totalDuration * 100).toFixed(2);
        const widthPct = Math.max(0.5, (endMs - startMs) / totalDuration * 100).toFixed(2);

        const spanClass = getSpanClass(displayName);
        const indent = depth * 16;
        const latencyLabel = latency != null ? `${latency.toFixed(2)}s` : '';
        const hasContent = input || output;
        const detailId = `span-${idx}`;
        const preview = spanPreview(displayName, input, output);

        html += `<div class="trace-span ${hasContent ? 'clickable' : ''}" ${hasContent ? `onclick="toggleSpanDetail('${detailId}')"` : ''}>
            <div class="trace-span-label" style="padding-left:${indent}px">
                <span class="trace-span-icon ${spanClass}"></span>
                <span class="trace-span-name">${escapeHtml(displayName)}</span>
                ${preview ? `<span class="trace-span-preview">${escapeHtml(preview)}</span>` : ''}
                <span class="trace-span-duration">${latencyLabel}</span>
            </div>
            <div class="trace-span-bar-container">
                <div class="trace-span-bar ${spanClass}" style="left:${leftPct}%;width:${widthPct}%"></div>
            </div>
        </div>`;

        // Expandable detail panel
        if (hasContent) {
            html += `<div id="${detailId}" class="trace-span-detail" style="display:none">`;
            if (input) {
                html += `<div class="trace-detail-section">
                    <div class="trace-detail-label">Input</div>
                    <pre class="trace-detail-content">${escapeHtml(input)}</pre>
                </div>`;
            }
            if (output) {
                html += `<div class="trace-detail-section">
                    <div class="trace-detail-label">Output</div>
                    <pre class="trace-detail-content">${escapeHtml(output)}</pre>
                </div>`;
            }
            html += '</div>';
        }
    }
    html += '</div>';

    return html;
}

function getSpanClass(name) {
    if (name.startsWith('session:')) return 'span-session';
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
    const currentIndex = sameExp.findIndex(a => String(a.analysisId || a.pr) === String(currentAnalysisId));
    const activeTab = new URLSearchParams(window.location.search).get('tab') || '';
    const tabParam = activeTab ? `&tab=${activeTab}` : '';
    
    const prevLink = document.getElementById('prev-analysis');
    const nextLink = document.getElementById('next-analysis');
    
    if (currentIndex > 0) {
        const prev = sameExp[currentIndex - 1];
        prevLink.href = `analysis.html?analysis=${prev.analysisId || prev.pr}&experiment=${currentExperiment}${tabParam}`;
        prevLink.textContent = `← ${getNavLabel(prev)}`;
    } else {
        prevLink.classList.add('disabled');
    }
    
    if (currentIndex < sameExp.length - 1) {
        const next = sameExp[currentIndex + 1];
        nextLink.href = `analysis.html?analysis=${next.analysisId || next.pr}&experiment=${currentExperiment}${tabParam}`;
        nextLink.textContent = `${getNavLabel(next)} →`;
    } else {
        nextLink.classList.add('disabled');
    }
}

function getDisplayTitle(analysis) {
    if (analysis.issueTitle && String(analysis.analysisId || analysis.pr) !== String(analysis.pr)) {
        return analysis.issueTitle;
    }
    return analysis.prTitle || analysis.issueTitle || '';
}

function getNavLabel(analysis) {
    if (analysis.issue && String(analysis.analysisId || analysis.pr) === String(analysis.issue)) {
        return `Issue #${analysis.issue}`;
    }
    return `PR #${analysis.pr}`;
}

function showError(message) {
    document.getElementById('page-title').textContent = 'Error';
    document.getElementById('panel-issue').innerHTML = `<p>${message}</p>`;
    document.getElementById('panel-issue').classList.add('active');
}

// Init
document.addEventListener('DOMContentLoaded', init);
