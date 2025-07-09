// widget_ui.js — Responsible for creating and managing the floating widget

import { extractJobDataEnhanced } from '../core/job_extractor.js';
import { showEnhancedSideModal } from './modal_ui.js';

let floatingWidget = null;
let restrictionInfo = null;
let enhancedExtractor = null;
let userSettings = null;
let isJobPage = false;
let lastExtractedJob = null;
let modalIsOpen = false;


export function initWidget(settings, restriction, isJob, extractor) {
    userSettings = settings;
    restrictionInfo = restriction;
    isJobPage = isJob;
    enhancedExtractor = extractor;

    if (shouldShowWidget()) {
        createFloatingWidget();
    }
}

function shouldShowWidget() {
    if (!userSettings) return false;
    return userSettings.displayMode === 'always' || isJobPage;
}

function createFloatingWidget() {
    if (floatingWidget) floatingWidget.remove();

    floatingWidget = document.createElement('div');
    floatingWidget.id = 'job-logger-floating-widget';
    floatingWidget.className = 'job-logger-widget collapsed';

    const domainText = userSettings.selectedDomain
        ? formatDomainName(userSettings.selectedDomain)
        : 'No Domain';
    const extractorStatus = enhancedExtractor ? '🚀 Enhanced' : '⚡ Basic';

    floatingWidget.innerHTML = `
        <div class="widget-trigger" id="widget-trigger">
            <span class="widget-icon">🔧</span>
        </div>
        
        <div class="widget-panel" id="widget-panel">
            <div class="widget-header">
                <div class="widget-title">
                    <span class="widget-icon-large">🔧</span>
                    <span class="widget-text">Job Logger</span>
                </div>
                <div class="extraction-status">
                    <small>${extractorStatus}</small>
                </div>
            </div>
            <div class="widget-content">
                <div class="widget-info">
                    <div class="current-domain">
                        <strong>Domain:</strong> ${domainText}
                    </div>
                    <div class="site-status" id="site-status">
                        ${restrictionInfo
            ? `<span class="status-warning">⚠️ Restricted Site</span>`
            : `<span class="status-safe">✅ Safe to Extract</span>`}
                    </div>
                </div>
                <div class="widget-buttons">
                    ${restrictionInfo
            ? `<button class="btn-manual-only" id="manual-only-btn">📝 Manual Entry Only</button>
                           <div class="restriction-warning"><small>⚠️ ${restrictionInfo.reason}</small></div>`
            : `<button class="btn-extract" id="extract-btn">🔍 Extract Job Data</button>
                           <button class="btn-manual" id="manual-btn">📝 Manual Entry</button>`}
                </div>
            </div>
        </div>
    `;

    setupWidgetEventListeners();
    makeWidgetDraggable();
    document.body.appendChild(floatingWidget);
    floatingWidget.classList.add('centered');
    setTimeout(() => restoreWidgetPosition(), 100);
}

// ——— Event Binding ———

function setupWidgetEventListeners() {
    floatingWidget.querySelector('#widget-trigger')?.addEventListener('click', toggleWidget);
    floatingWidget.querySelector('#extract-btn')?.addEventListener('click', handleExtractClick);
    floatingWidget.querySelector('#manual-btn')?.addEventListener('click', handleManualClick);
    floatingWidget.querySelector('#manual-only-btn')?.addEventListener('click', handleManualClick);

    document.addEventListener('click', (e) => {
        if (!floatingWidget.contains(e.target) && !floatingWidget.classList.contains('collapsed')) {
            collapseWidget();
        }
    });
}

function toggleWidget() {
    if (modalIsOpen) {
        document.querySelector('.job-logger-side-modal')?.remove();
        modalIsOpen = false;
    }

    floatingWidget.classList.toggle('collapsed');
    floatingWidget.classList.toggle('expanded');

    // Re-render buttons if modal had been open before
    if (!floatingWidget.classList.contains('collapsed')) {
        updateWidgetButtons();
    }
}

function updateWidgetButtons() {
    const buttonsContainer = floatingWidget.querySelector('.widget-buttons');
    if (!buttonsContainer) return;

    if (lastExtractedJob) {
        buttonsContainer.innerHTML = `
            <button class="btn-manual" id="view-extracted-btn">📄 View Extracted Job</button>
            <button class="btn-extract" id="reextract-btn">🔁 Re-extract Job</button>
        `;
        floatingWidget.querySelector('#view-extracted-btn')?.addEventListener('click', handleViewExtractedClick);
        floatingWidget.querySelector('#reextract-btn')?.addEventListener('click', handleReExtractClick);
    } else {
        buttonsContainer.innerHTML = restrictionInfo
            ? `<button class="btn-manual-only" id="manual-only-btn">📝 Manual Entry Only</button>
               <div class="restriction-warning"><small>⚠️ ${restrictionInfo.reason}</small></div>`
            : `<button class="btn-extract" id="extract-btn">🔍 Extract Job Data</button>
               <button class="btn-manual" id="manual-btn">📝 Manual Entry</button>`;

        floatingWidget.querySelector('#extract-btn')?.addEventListener('click', handleExtractClick);
        floatingWidget.querySelector('#manual-btn')?.addEventListener('click', handleManualClick);
        floatingWidget.querySelector('#manual-only-btn')?.addEventListener('click', handleManualClick);
    }
}


function collapseWidget() {
    floatingWidget.classList.remove('expanded');
    floatingWidget.classList.add('collapsed');
}

function handleExtractClick(triggeringBtn = null) {
    if (!userSettings.selectedDomain) {
        alert('Please select a domain first! Click the extension icon to configure.');
        return;
    }

    const extractBtn = triggeringBtn || floatingWidget.querySelector('#extract-btn');
    const originalText = extractBtn ? extractBtn.innerHTML : '🔍 Extract Job Data';
    if (extractBtn) {
        extractBtn.innerHTML = '⏳ Extracting...';
        extractBtn.disabled = true;
    }

    extractJobDataEnhanced().then((jobData) => {
        lastExtractedJob = jobData;
        modalIsOpen = true;
        collapseWidget();
        showEnhancedSideModal(jobData, false);
    }).catch((error) => {
        alert('Extraction failed. Try manual.');
        console.error(error);
    }).finally(() => {
        if (extractBtn) {
            extractBtn.innerHTML = originalText;
            extractBtn.disabled = false;
        }
    });
}


function handleViewExtractedClick() {
    if (!lastExtractedJob) return;
    collapseWidget();
    modalIsOpen = true;
    showEnhancedSideModal(lastExtractedJob, false);
}

function handleReExtractClick(e) {
    lastExtractedJob = null;
    handleExtractClick(e.currentTarget); // pass the clicked button
}

function handleManualClick() {
    if (!userSettings.selectedDomain) {
        alert('Please select a domain first! Click the extension icon to configure.');
        return;
    }

    collapseWidget();
    showEnhancedSideModal({
        company: '',
        title: '',
        location: '',
        description: '',
        applicationUrl: window.location.href,
        url: window.location.href,
        qualityScore: 0,
        qualityGrade: 'Manual Entry',
        extractionMethod: 'manual'
    }, true);
}

// ——— Utility Functions ———

function formatDomainName(domainId) {
    const domainNames = {
        'software_development': 'Software Dev',
        'devops': 'DevOps',
        'cybersecurity': 'Cybersecurity',
        'data_science': 'Data Science',
        'mobile_development': 'Mobile Dev',
        'web_development': 'Web Dev',
        'ui_ux_design': 'UI/UX Design',
        'product_management': 'Product Mgmt'
    };
    return domainNames[domainId] || domainId.replace('_', ' ');
}

// ——— Position Persistence ———

function makeWidgetDraggable() {
    let isDragging = false;
    let startY = 0;
    let startTop = 0;
    let animationFrameId = null;

    const trigger = floatingWidget.querySelector('.widget-trigger');
    floatingWidget.style.willChange = 'transform, top';

    trigger.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', endDrag);

    trigger.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            e.clientY = touch.clientY;
            startDrag(e);
        }
    }, { passive: false });

    document.addEventListener('touchmove', dragTouch, { passive: false });
    document.addEventListener('touchend', endDrag);

    function startDrag(e) {
        e.preventDefault();
        e.stopPropagation();

        isDragging = true;
        startY = e.clientY;

        const rect = floatingWidget.getBoundingClientRect();
        startTop = rect.top;

        floatingWidget.classList.add('dragging');
        floatingWidget.classList.remove('centered');
        floatingWidget.style.setProperty('top', startTop + 'px', 'important');
        floatingWidget.style.setProperty('transform', 'none', 'important');

        trigger.style.cursor = 'grabbing';
        trigger.style.transform = 'translateY(-50%) scale(0.95)';
    }

    function drag(e) {
        if (!isDragging) return;
        e.preventDefault();

        const currentY = e.clientY;
        const deltaY = currentY - startY;
        let newTop = startTop + deltaY;
        newTop = Math.max(60, Math.min(newTop, window.innerHeight - 120));

        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        animationFrameId = requestAnimationFrame(() => {
            floatingWidget.style.setProperty('top', newTop + 'px', 'important');
        });
    }

    function dragTouch(e) {
        if (e.touches.length === 1) {
            e.clientY = e.touches[0].clientY;
            drag(e);
        }
    }

    function endDrag() {
        if (!isDragging) return;

        isDragging = false;
        trigger.style.cursor = 'pointer';
        trigger.style.transform = 'translateY(-50%)';
        floatingWidget.classList.remove('dragging');
        floatingWidget.style.setProperty('transition', 'top 0.25s ease-out', 'important');

        const rect = floatingWidget.getBoundingClientRect();
        localStorage.setItem('job-logger-widget-top', rect.top.toString());
    }
}


function restoreWidgetPosition() {
    try {
        const savedTop = localStorage.getItem('job-logger-widget-top');
        if (savedTop && floatingWidget) {
            const topValue = parseFloat(savedTop);

            // Validate the saved position is still within viewport
            const minTop = 60;
            const maxTop = window.innerHeight - 120;

            if (topValue >= minTop && topValue <= maxTop) {
                // Remove centered class and set custom position
                floatingWidget.classList.remove('centered');
                floatingWidget.style.setProperty('top', topValue + 'px', 'important');
                floatingWidget.style.setProperty('transform', 'none', 'important');
                console.log('📍 Restored widget position to:', topValue);
            } else {
                // Use default centered position
                floatingWidget.classList.add('centered');
                console.log('📍 Saved position out of bounds, using centered');
            }
        } else {
            // No saved position, use default centered
            floatingWidget.classList.add('centered');
            console.log('📍 No saved position, using centered');
        }
    } catch (error) {
        // Fallback to centered position
        floatingWidget.classList.add('centered');
        console.log('⚠️ Could not restore position, using centered:', error);
    }
}

export function removeWidgetIfExists() {
    if (floatingWidget) {
        floatingWidget.remove();
        floatingWidget = null;
    }
}
