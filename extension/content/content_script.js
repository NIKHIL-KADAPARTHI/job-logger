// content_script.js - Enhanced version with improved extraction
console.log('🔧 Job Logger Content Script Loaded on:', window.location.hostname);

let widgetModulePromise = import(chrome.runtime.getURL('ui/widget_ui.js'));
let extractorModulePromise = import(chrome.runtime.getURL('core/job_extractor.js'));

// Restricted sites list (moved inline to fix loading issues)
const RESTRICTED_SITES = [
    {
        domain: 'linkedin.com',
        name: 'LinkedIn',
        reason: 'Account safety - LinkedIn may block your account for automated data extraction'
    },
    {
        domain: 'indeed.com',
        name: 'Indeed',
        reason: 'Terms of Service violation - Indeed prohibits automated data extraction'
    },
    {
        domain: 'glassdoor.com',
        name: 'Glassdoor',
        reason: 'Anti-bot protection - Glassdoor blocks automated access'
    },
    {
        domain: 'ziprecruiter.com',
        name: 'ZipRecruiter',
        reason: 'API-only access - Scraping not permitted'
    },
    {
        domain: 'monster.com',
        name: 'Monster',
        reason: 'Terms of Service violation - Monster prohibits scraping'
    }
];

// Check if current site is restricted
function isRestrictedSite() {
    const hostname = window.location.hostname.toLowerCase();
    console.log('🔍 Checking hostname:', hostname);

    const restricted = RESTRICTED_SITES.find(site =>
        hostname.includes(site.domain) ||
        hostname.includes(site.domain.replace('.com', ''))
    );

    console.log('🔍 Restriction check result:', restricted);
    return restricted;
}

// Global variables
let floatingWidget = null;
let verificationModal = null;
let userSettings = null;
let isJobPage = false;
let restrictionInfo = null;
let enhancedExtractor = null;

// Initialize content script
async function initializeContentScript() {
    console.log('📍 Initializing enhanced content script...');

    // Check if site is restricted
    restrictionInfo = isRestrictedSite();
    console.log('🔍 Restriction info:', restrictionInfo);

    // Initialize enhanced extractor
    try {
        if (window.EnhancedJobExtractor) {
            enhancedExtractor = new window.EnhancedJobExtractor();
            console.log('✅ Enhanced extractor initialized');
        } else {
            console.warn('⚠️ Enhanced extractor not available, will retry...');
            // Retry after a short delay
            setTimeout(() => {
                if (window.EnhancedJobExtractor) {
                    enhancedExtractor = new window.EnhancedJobExtractor();
                    console.log('✅ Enhanced extractor initialized (retry)');
                }
            }, 500);
        }
    } catch (error) {
        console.error('❌ Failed to initialize enhanced extractor:', error);
    }

    // Load user settings
    await loadUserSettings();

    // Enhanced job content detection
    isJobPage = detectJobContent();

    // Initialize floating widget from external module
    try {
        const widgetModule = await widgetModulePromise;
        widgetModule.initWidget(userSettings, restrictionInfo, isJobPage, enhancedExtractor);
    } catch (error) {
        console.error('❌ Failed to load widget module:', error);
    }

    console.log('✅ Enhanced content script initialized', {
        isRestricted: !!restrictionInfo,
        isJobPage,
        hasEnhancedExtractor: !!enhancedExtractor,
        hostname: window.location.hostname
    });
    // Retry widget injection if the widget didn’t appear initially (e.g., for Greenhouse)
    const hostname = window.location.hostname.toLowerCase();

    if (hostname.includes('greenhouse.io')) {
        setTimeout(async () => {
            if (!document.querySelector('.job-logger-floating-widget') && !restrictionInfo) {
                const widgetModule = await widgetModulePromise;
                const recheckJobPage = detectJobContent();

                if (recheckJobPage) {
                    console.log('🛠️ Retrying widget injection for Greenhouse (delayed DOM)');
                    widgetModule.initWidget(userSettings, restrictionInfo, recheckJobPage, enhancedExtractor);
                }
            }
        }, 1500);
    }

}

// Load user settings from Chrome storage
async function loadUserSettings() {
    try {
        const result = await chrome.storage.local.get(['selectedDomain', 'displayMode', 'userId']);
        userSettings = result;
        console.log('⚙️ Loaded settings:', userSettings);
    } catch (error) {
        console.error('❌ Failed to load settings:', error);
        userSettings = { displayMode: 'smart' };
    }
}

// Enhanced job content detection
function detectJobContent() {
    const jobKeywords = [
        'job', 'career', 'position', 'opportunity', 'hiring', 'employment',
        'apply', 'salary', 'benefits', 'requirements', 'experience',
        'developer', 'engineer', 'manager', 'analyst', 'specialist',
        'responsibilities', 'qualifications', 'candidate', 'role'
    ];

    const contentText = document.body.innerText.toLowerCase();
    const title = document.title.toLowerCase();
    const url = window.location.href.toLowerCase();

    // Enhanced URL pattern detection
    const jobUrlPatterns = [
        '/job', '/career', '/hiring', '/position', '/opportunity',
        '/apply', '/jobs', '/careers', '/employment', '/work-with-us',
        '/join-us', '/join-our-team', '/openings', '/positions',
        '/work', '/talent', '/recruiting'
    ];

    const hasJobUrl = jobUrlPatterns.some(pattern => url.includes(pattern));

    // Enhanced keyword detection with scoring
    const keywordMatches = jobKeywords.filter(keyword =>
        contentText.includes(keyword) || title.includes(keyword)
    ).length;

    const hasJobKeywords = keywordMatches >= 4; // Raised threshold for better accuracy

    // Job posting indicators
    const jobIndicators = [
        'apply now', 'job description', 'about the role', 'what you\'ll do',
        'requirements', 'qualifications', 'years of experience', 'we are looking for',
        'job responsibilities', 'position summary', 'join our team'
    ];

    const hasJobIndicators = jobIndicators.some(indicator =>
        contentText.includes(indicator)
    );

    // Enhanced structured data detection
    const hasJobStructuredData = document.querySelector('script[type="application/ld+json"]') !== null;

    const isJobContent = hasJobUrl || hasJobKeywords || hasJobIndicators || hasJobStructuredData;

    console.log('🔍 Enhanced job detection:', {
        hasJobUrl,
        keywordMatches,
        hasJobKeywords,
        hasJobIndicators,
        hasJobStructuredData,
        isJobContent
    });

    return isJobContent;
}

// Format domain name for display
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

// Enhanced extract button click handler
// Enhanced extract button click handler
async function handleExtractClick() {
    console.log('🔍 Enhanced extract button clicked');

    if (!userSettings.selectedDomain) {
        alert('Please select a domain first! Click the extension icon to configure.');
        return;
    }

    const extractBtn = document.querySelector('#extract-btn');
    const originalText = extractBtn?.innerHTML;
    if (extractBtn) {
        extractBtn.innerHTML = '⏳ Extracting...';
        extractBtn.disabled = true;
    }

    try {
        const extractorModule = await extractorModulePromise;
        const jobData = await extractorModule.extractJobDataEnhanced();

        collapseWidget(); // Collapse before showing modal
        showEnhancedSideModal(jobData, false);

    } catch (error) {
        console.error('❌ Extraction failed:', error);
        alert('Enhanced extraction failed. Try manual entry.');
    } finally {
        if (extractBtn) {
            extractBtn.innerHTML = originalText;
            extractBtn.disabled = false;
        }
    }
}



// Handle manual button click
function handleManualClick() {
    console.log('📝 Manual entry clicked');

    if (!userSettings.selectedDomain) {
        alert('Please select a domain first! Click the extension icon to configure.');
        return;
    }

    // Collapse widget BEFORE showing modal
    collapseWidget();

    // Show modal with empty data
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


// Enhanced side modal with quality indicators
function showEnhancedSideModal(jobData, isManual = false) {
    // Remove existing modal
    if (verificationModal) {
        verificationModal.remove();
        verificationModal = null;
    }

    // Create enhanced side modal
    verificationModal = document.createElement('div');
    verificationModal.className = 'job-logger-side-modal enhanced';

    // Quality indicator styling
    const qualityClass = getQualityClass(jobData.qualityScore);
    const qualityIcon = getQualityIcon(jobData.qualityScore);

    verificationModal.innerHTML = `
        <div class="side-modal-header">
            <h3>${isManual ? '📝 Manual Job Entry' : '✅ Verify Extracted Data'}</h3>
            ${!isManual ? `
                <div class="quality-indicator ${qualityClass}">
                    ${qualityIcon} ${jobData.qualityGrade}
                </div>
            ` : ''}
            <button class="close-btn" type="button">×</button>
        </div>
        
        <div class="side-modal-content">
            ${!isManual ? `
                <div class="extraction-info">
                    <div class="extraction-stats">
                        <span class="stat">
                            <strong>Site:</strong> ${jobData.siteDetected || 'Unknown'}
                        </span>
                        <span class="stat">
                            <strong>Method:</strong> ${jobData.extractionMethod || 'unknown'}
                        </span>
                        <span class="stat">
                            <strong>Time:</strong> ${jobData.extractionTime || 0}ms
                        </span>
                        <span class="stat">
                            <strong>Score:</strong> ${jobData.qualityScore || 0}/100
                        </span>
                    </div>
                </div>
            ` : ''}
            
            <div class="field-group">
                <label>Company Name: <span class="required">*</span></label>
                <input type="text" id="job-company" value="${jobData.company || ''}" placeholder="Enter company name">
                <small>Minimum 2 characters required</small>
            </div>
            
            <div class="field-group">
                <label>Job Title: <span class="required">*</span></label>
                <input type="text" id="job-title" value="${jobData.title || ''}" placeholder="Enter job title">
                <small>Minimum 3 characters required</small>
            </div>
            
            <div class="field-group">
                <label>Location: <span class="required">*</span></label>
                <input type="text" id="job-location" value="${jobData.location || ''}" placeholder="Enter location or 'Remote'">
                <small>💡 Enter city or "Remote" if not found</small>
            </div>
            
            <div class="field-group">
                <label>Job Description: <span class="required">*</span></label>
                <textarea id="job-description" placeholder="Enter job description (minimum 50 characters)">${jobData.description || ''}</textarea>
                <small>💡 Minimum 50 characters required</small>
            </div>
            
            <div class="field-group">
                <label>Application URL: <span class="required">*</span></label>
                <input type="url" id="job-url" value="${jobData.applicationUrl || jobData.url || window.location.href}" placeholder="Enter application URL">
                <small>💡 Verify this is the correct application link</small>
            </div>
        </div>
        
        <div class="side-modal-footer">
            <button class="btn-cancel" type="button">Cancel</button>
            <button class="btn-submit" type="button">Verify & Log Job</button>
        </div>
    `;

    // Add to page
    document.body.appendChild(verificationModal);
    verificationModal.classList.add('default-position');

    // Setup event listeners for modal buttons
    setupModalEventListeners();

    // Make modal draggable and resizable
    setTimeout(() => {
        makeModalDraggableAndResizable();
        restoreModalPosition();
        handleModalResponsiveReposition();

        // Initial responsive check
        setTimeout(() => {
            repositionModalWithinBounds();
        }, 200);
    }, 100);

    // Focus on first empty field
    setTimeout(() => {
        const firstEmptyField = verificationModal.querySelector('input[value=""], textarea:empty');
        if (firstEmptyField) {
            firstEmptyField.focus();
        }
    }, 200);

    console.log('📝 Enhanced side modal shown with quality indicators');
}

// Quality indicator helpers
function getQualityClass(score) {
    if (score >= 90) return 'quality-excellent';
    if (score >= 80) return 'quality-very-good';
    if (score >= 70) return 'quality-good';
    if (score >= 60) return 'quality-fair';
    if (score >= 50) return 'quality-poor';
    return 'quality-failed';
}

function getQualityIcon(score) {
    if (score >= 90) return '🎯';
    if (score >= 80) return '✅';
    if (score >= 70) return '👍';
    if (score >= 60) return '⚠️';
    if (score >= 50) return '❌';
    return '🚫';
}

// Setup modal event listeners
function setupModalEventListeners() {
    // Close button
    const closeBtn = verificationModal.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔴 Close button clicked');
            if (verificationModal) {
                verificationModal.remove();
                verificationModal = null;
            }
        });
    }

    // Cancel button
    const cancelBtn = verificationModal.querySelector('.btn-cancel');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔴 Cancel button clicked');
            if (verificationModal) {
                verificationModal.remove();
                verificationModal = null;
            }
        });
    }

    // Submit button
    const submitBtn = verificationModal.querySelector('.btn-submit');
    if (submitBtn) {
        submitBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🟢 Submit button clicked');
            submitJobData();
        });
    }
}

// Make modal draggable and resizable
function makeModalDraggableAndResizable() {
    if (!verificationModal) return;

    const header = verificationModal.querySelector('.side-modal-header');
    let isDragging = false;
    let isResizing = false;
    let dragStartX, dragStartY, modalStartX, modalStartY;
    let resizeStartX, resizeStartY, modalStartWidth, modalStartHeight;

    // Make header draggable
    header.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', endDrag);

    // Add resize functionality
    verificationModal.addEventListener('mousedown', startResize);

    function startDrag(e) {
        if (e.target.closest('.close-btn') || e.target.closest('.quality-indicator') || e.target.tagName === 'BUTTON') {
            return; // 🛡️ prevent accidental drag from buttons
        }

        isDragging = true;
        dragStartX = e.clientX;
        dragStartY = e.clientY;

        const rect = verificationModal.getBoundingClientRect();
        modalStartX = rect.left;
        modalStartY = rect.top;

        verificationModal.classList.add('dragging');
        verificationModal.classList.remove('default-position');

        verificationModal.style.setProperty('top', modalStartY + 'px', 'important');
        verificationModal.style.setProperty('left', modalStartX + 'px', 'important');

        header.style.cursor = 'grabbing';

        e.preventDefault();
        console.log('🖱️ Started dragging modal at:', modalStartX, modalStartY);
    }


    function startResize(e) {
        // 🛡️ Don't trigger resize if clicking on buttons or close icon
        if (e.target.closest('.close-btn') || e.target.closest('.btn-cancel') || e.target.closest('.btn-submit')) {
            return;
        }

        const rect = verificationModal.getBoundingClientRect();
        const borderSize = 20;

        if (e.clientX >= rect.right - borderSize &&
            e.clientY >= rect.bottom - borderSize) {

            isResizing = true;
            resizeStartX = e.clientX;
            resizeStartY = e.clientY;
            modalStartWidth = rect.width;
            modalStartHeight = rect.height;

            verificationModal.classList.add('resizing');
            verificationModal.classList.remove('default-position');

            verificationModal.style.setProperty('width', modalStartWidth + 'px', 'important');
            verificationModal.style.setProperty('height', modalStartHeight + 'px', 'important');

            e.preventDefault();
            console.log('🔧 Started resizing modal at:', modalStartWidth, modalStartHeight);
        }
    }


    function drag(e) {
        if (isDragging) {
            const deltaX = e.clientX - dragStartX;
            const deltaY = e.clientY - dragStartY;

            let newX = modalStartX + deltaX;
            let newY = modalStartY + deltaY;

            const margin = 20;
            const modalWidth = verificationModal.offsetWidth;
            const modalHeight = verificationModal.offsetHeight;
            const maxX = window.innerWidth - modalWidth - margin;
            const maxY = window.innerHeight - modalHeight - margin;

            newX = Math.max(margin, Math.min(newX, maxX));
            newY = Math.max(margin, Math.min(newY, maxY));

            verificationModal.style.setProperty('left', newX + 'px', 'important');
            verificationModal.style.setProperty('top', newY + 'px', 'important');

            console.log('🖱️ Dragging modal to:', newX, newY);
        }

        if (isResizing) {
            const deltaX = e.clientX - resizeStartX;
            const deltaY = e.clientY - resizeStartY;

            let newWidth = modalStartWidth + deltaX;
            let newHeight = modalStartHeight + deltaY;

            const minWidth = 380;
            const minHeight = 450;
            const maxWidth = window.innerWidth * 0.95;
            const maxHeight = window.innerHeight * 0.95;

            newWidth = Math.max(minWidth, Math.min(newWidth, maxWidth));
            newHeight = Math.max(minHeight, Math.min(newHeight, maxHeight));

            const currentLeft = verificationModal.getBoundingClientRect().left;
            const currentTop = verificationModal.getBoundingClientRect().top;

            if (currentLeft + newWidth > window.innerWidth - 20) {
                const adjustedLeft = window.innerWidth - newWidth - 20;
                verificationModal.style.setProperty('left', Math.max(20, adjustedLeft) + 'px', 'important');
            }

            if (currentTop + newHeight > window.innerHeight - 20) {
                const adjustedTop = window.innerHeight - newHeight - 20;
                verificationModal.style.setProperty('top', Math.max(20, adjustedTop) + 'px', 'important');
            }

            verificationModal.style.setProperty('width', newWidth + 'px', 'important');
            verificationModal.style.setProperty('height', newHeight + 'px', 'important');
            console.log('🔧 Resizing modal to:', newWidth, newHeight);
        }
    }

    function endDrag() {
        if (isDragging) {
            isDragging = false;
            verificationModal.classList.remove('dragging');
            header.style.cursor = 'move';
            verificationModal.style.setProperty('transition', 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 'important');

            const rect = verificationModal.getBoundingClientRect();
            try {
                localStorage.setItem('job-logger-modal-position', JSON.stringify({
                    left: rect.left,
                    top: rect.top,
                    width: rect.width,
                    height: rect.height
                }));
                console.log('💾 Saved modal position:', rect.left, rect.top);
            } catch (error) {
                console.log('⚠️ Could not save modal position:', error);
            }
        }

        if (isResizing) {
            isResizing = false;
            verificationModal.classList.remove('resizing');
            verificationModal.style.setProperty('transition', 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 'important');

            const rect = verificationModal.getBoundingClientRect();
            try {
                localStorage.setItem('job-logger-modal-position', JSON.stringify({
                    left: rect.left,
                    top: rect.top,
                    width: rect.width,
                    height: rect.height
                }));
                console.log('💾 Saved modal size:', rect.width, rect.height);
            } catch (error) {
                console.log('⚠️ Could not save modal size:', error);
            }
        }
    }

    // Add visual resize indicator
    addResizeIndicator();
}

// Add visual resize indicator
function addResizeIndicator() {
    if (!verificationModal || verificationModal.querySelector('.resize-indicator')) return;

    const resizeIndicator = document.createElement('div');
    resizeIndicator.className = 'resize-indicator';
    resizeIndicator.innerHTML = '⋮⋮';

    resizeIndicator.style.cssText = `
        position: absolute !important;
        bottom: 4px !important;
        right: 4px !important;
        width: 16px !important;
        height: 16px !important;
        cursor: se-resize !important;
        color: rgba(0, 123, 255, 0.6) !important;
        font-size: 12px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        background: rgba(255, 255, 255, 0.8) !important;
        border-radius: 4px !important;
        user-select: none !important;
        z-index: 10 !important;
        transition: all 0.2s ease !important;
    `;

    resizeIndicator.addEventListener('mouseenter', () => {
        resizeIndicator.style.color = 'rgba(0, 123, 255, 1)';
        resizeIndicator.style.background = 'rgba(255, 255, 255, 1)';
    });

    resizeIndicator.addEventListener('mouseleave', () => {
        resizeIndicator.style.color = 'rgba(0, 123, 255, 0.6)';
        resizeIndicator.style.background = 'rgba(255, 255, 255, 0.8)';
    });

    verificationModal.appendChild(resizeIndicator);
}

// Restore modal position and size
function restoreModalPosition() {
    if (!verificationModal) return;

    try {
        const saved = localStorage.getItem('job-logger-modal-position');
        if (saved) {
            const position = JSON.parse(saved);

            if (modalFitsInViewport(position.left, position.top, position.width, position.height)) {
                verificationModal.classList.remove('default-position');

                verificationModal.style.setProperty('left', position.left + 'px', 'important');
                verificationModal.style.setProperty('top', position.top + 'px', 'important');
                verificationModal.style.setProperty('width', position.width + 'px', 'important');
                verificationModal.style.setProperty('height', position.height + 'px', 'important');

                console.log('📍 Restored modal position and size:', position);
            } else {
                console.log('📱 Saved position doesn\'t fit viewport, using responsive positioning');
                verificationModal.classList.remove('default-position');

                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;

                const responsiveWidth = Math.min(position.width || 400, viewportWidth * 0.9, 600);
                const responsiveHeight = Math.min(position.height || 600, viewportHeight * 0.9, 800);

                let responsiveLeft = Math.max(20, (viewportWidth - responsiveWidth) / 2);
                let responsiveTop = Math.max(20, (viewportHeight - responsiveHeight) / 2);

                responsiveLeft = Math.min(responsiveLeft, viewportWidth - responsiveWidth - 20);
                responsiveTop = Math.min(responsiveTop, viewportHeight - responsiveHeight - 20);

                verificationModal.style.setProperty('left', responsiveLeft + 'px', 'important');
                verificationModal.style.setProperty('top', responsiveTop + 'px', 'important');
                verificationModal.style.setProperty('width', responsiveWidth + 'px', 'important');
                verificationModal.style.setProperty('height', responsiveHeight + 'px', 'important');

                localStorage.setItem('job-logger-modal-position', JSON.stringify({
                    left: responsiveLeft,
                    top: responsiveTop,
                    width: responsiveWidth,
                    height: responsiveHeight
                }));

                console.log('📱 Applied responsive modal positioning');
            }
        } else {
            verificationModal.classList.remove('default-position');

            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            const defaultWidth = Math.min(400, viewportWidth * 0.9);
            const defaultHeight = Math.min(600, viewportHeight * 0.9);

            const defaultLeft = Math.max(20, (viewportWidth - defaultWidth) / 4);
            const defaultTop = Math.max(20, (viewportHeight - defaultHeight) / 4);

            verificationModal.style.setProperty('left', defaultLeft + 'px', 'important');
            verificationModal.style.setProperty('top', defaultTop + 'px', 'important');
            verificationModal.style.setProperty('width', defaultWidth + 'px', 'important');
            verificationModal.style.setProperty('height', defaultHeight + 'px', 'important');

            console.log('📱 Applied smart default modal positioning');
        }
    } catch (error) {
        verificationModal.classList.add('default-position');
        console.log('⚠️ Could not restore modal position, using CSS default:', error);
    }
}

// Handle responsive repositioning when viewport changes
function handleModalResponsiveReposition() {
    if (!verificationModal) return;

    let resizeTimeout;

    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            repositionModalWithinBounds();
        }, 100);
    });

    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            repositionModalWithinBounds();
        }, 500);
    });
}

// Reposition modal to stay within viewport bounds
function repositionModalWithinBounds() {
    if (!verificationModal) return;

    const rect = verificationModal.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let newLeft = rect.left;
    let newTop = rect.top;
    let newWidth = rect.width;
    let newHeight = rect.height;
    let needsUpdate = false;

    const maxWidth = viewportWidth * 0.9;
    if (newWidth > maxWidth) {
        newWidth = maxWidth;
        needsUpdate = true;
        console.log('📱 Adjusting modal width for viewport:', newWidth);
    }

    const maxHeight = viewportHeight * 0.9;
    if (newHeight > maxHeight) {
        newHeight = maxHeight;
        needsUpdate = true;
        console.log('📱 Adjusting modal height for viewport:', newHeight);
    }

    const maxLeft = viewportWidth - newWidth;
    const maxTop = viewportHeight - newHeight;

    if (newLeft < 0) {
        newLeft = 20;
        needsUpdate = true;
        console.log('📱 Adjusting modal left position:', newLeft);
    } else if (newLeft > maxLeft) {
        newLeft = Math.max(20, maxLeft - 20);
        needsUpdate = true;
        console.log('📱 Adjusting modal left position:', newLeft);
    }

    if (newTop < 0) {
        newTop = 20;
        needsUpdate = true;
        console.log('📱 Adjusting modal top position:', newTop);
    } else if (newTop > maxTop) {
        newTop = Math.max(20, maxTop - 20);
        needsUpdate = true;
        console.log('📱 Adjusting modal top position:', newTop);
    }

    if (needsUpdate) {
        verificationModal.classList.remove('default-position');
        verificationModal.style.setProperty('transition', 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 'important');
        verificationModal.style.setProperty('left', newLeft + 'px', 'important');
        verificationModal.style.setProperty('top', newTop + 'px', 'important');
        verificationModal.style.setProperty('width', newWidth + 'px', 'important');
        verificationModal.style.setProperty('height', newHeight + 'px', 'important');

        try {
            localStorage.setItem('job-logger-modal-position', JSON.stringify({
                left: newLeft,
                top: newTop,
                width: newWidth,
                height: newHeight
            }));
            console.log('💾 Saved responsive modal position');
        } catch (error) {
            console.log('⚠️ Could not save responsive position:', error);
        }
    }
}

// Check if modal fits in current viewport
function modalFitsInViewport(left, top, width, height) {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    return (
        left >= 0 &&
        top >= 0 &&
        (left + width) <= viewportWidth &&
        (top + height) <= viewportHeight &&
        width <= (viewportWidth * 0.9) &&
        height <= (viewportHeight * 0.9)
    );
}

// Submit job data (enhanced validation)
function submitJobData() {
    const jobData = {
        company: document.getElementById('job-company').value.trim(),
        title: document.getElementById('job-title').value.trim(),
        location: document.getElementById('job-location').value.trim(),
        description: document.getElementById('job-description').value.trim(),
        applicationUrl: document.getElementById('job-url').value.trim()
    };

    // Enhanced validation
    if (!jobData.company || jobData.company.length < 2) {
        alert('Please enter a valid company name (minimum 2 characters)');
        return;
    }

    if (!jobData.title || jobData.title.length < 3) {
        alert('Please enter a valid job title (minimum 3 characters)');
        return;
    }

    if (!jobData.location || jobData.location.length < 2) {
        alert('Please enter a valid location (minimum 2 characters or "Remote")');
        return;
    }

    if (!jobData.description || jobData.description.length < 50) {
        alert('Please enter a job description (minimum 50 characters)');
        return;
    }

    if (!jobData.applicationUrl || !isValidUrl(jobData.applicationUrl)) {
        alert('Please enter a valid URL');
        return;
    }

    console.log('📊 Enhanced validated job data ready for submission:', jobData);

    // Enhanced success message
    alert(`✅ Job data validated successfully!\n\n🏢 Company: ${jobData.company}\n💼 Title: ${jobData.title}\n📍 Location: ${jobData.location}\n🔗 URL: ${jobData.applicationUrl}\n\n🚀 Next: We'll connect this to the server in Phase 4!`);

    // Close modal
    if (verificationModal) {
        verificationModal.remove();
        verificationModal = null;
    }
}

// Validate URL
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// Listen for settings updates from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SETTINGS_UPDATED') {
        console.log('⚙️ Settings updated, refreshing enhanced widget...');

        loadUserSettings().then(() => {
            widgetModulePromise.then((widgetModule) => {
                widgetModule.removeWidgetIfExists?.();
                widgetModule.initWidget?.(userSettings, restrictionInfo, isJobPage, enhancedExtractor);
            });
        });

        sendResponse({ status: 'received' });
    }
});

// Initialize when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeContentScript);
} else {
    initializeContentScript();
}