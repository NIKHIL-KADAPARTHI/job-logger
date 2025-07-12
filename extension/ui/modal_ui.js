// modal_ui.js — Responsible for rendering and handling the modal

export function showEnhancedSideModal(jobData, isManual = false) {
    const existing = document.querySelector('.job-logger-side-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.className = 'job-logger-side-modal enhanced default-position';

    const qualityClass = getQualityClass(jobData.qualityScore);
    const qualityIcon = getQualityIcon(jobData.qualityScore);

    modal.innerHTML = `
    <div class="side-modal-header">
      <h3>${isManual ? '📝 Manual Job Entry' : '✅ Verify Extracted Data'}</h3>
      ${!isManual ? `<div class="quality-indicator ${qualityClass}">${qualityIcon} ${jobData.qualityGrade}</div>` : ''}
      <button class="close-btn" type="button">×</button>
    </div>
    <div class="side-modal-content">
      ${renderField('Company Name', 'job-company', jobData.company, 'Minimum 2 characters required')}
      ${renderField('Job Title', 'job-title', jobData.title, 'Minimum 3 characters required')}
      ${renderField('Location', 'job-location', jobData.location, '💡 Enter city or "Remote" if not found')}
      ${renderTextArea('Job Description', 'job-description', jobData.description, '💡 Minimum 50 characters required')}
      ${renderField('Application URL', 'job-url', jobData.applicationUrl || jobData.url, '💡 Verify this is the correct application link')}
    </div>
    <div class="side-modal-footer">
      <button class="btn-cancel" type="button">Cancel</button>
      <button class="btn-submit" type="button">Verify & Log Job</button>
    </div>
  `;

    document.body.appendChild(modal);
    modal.appendChild(createResizeHandle(modal));
    // Create feedback overlay container
    const feedbackOverlay = document.createElement('div');
    feedbackOverlay.className = 'modal-feedback-overlay';
    feedbackOverlay.innerHTML = `
    <div class="feedback-content">
    <div class="spinner"></div>
    <div class="feedback-icon success">✅</div>
    <div class="feedback-icon error">❌</div>
    <div class="feedback-icon duplicate">⚠️</div>
    <p class="feedback-message"></p>
    </div>
    `;

    modal.appendChild(feedbackOverlay);


    modal.querySelector('.close-btn')?.addEventListener('click', () => modal.remove());
    modal.querySelector('.btn-cancel')?.addEventListener('click', () => modal.remove());
    modal.querySelector('.btn-submit')?.addEventListener('click', () => submitJobData(modal));

    setTimeout(() => {
        makeDraggable(modal);
    }, 50);
}

function renderField(label, id, value = '', helpText = '') {
    return `
    <div class="field-group">
      <label>${label}: <span class="required">*</span></label>
      <input type="text" id="${id}" value="${value || ''}" placeholder="Enter ${label.toLowerCase()}">
      <small data-help="${helpText}">${helpText}</small>
    </div>
  `;
}

function renderTextArea(label, id, value = '', helpText = '') {
    return `
    <div class="field-group">
      <label>${label}: <span class="required">*</span></label>
      <textarea id="${id}" placeholder="Enter ${label.toLowerCase()}">${value || ''}</textarea>
      <small data-help="${helpText}">${helpText}</small>
    </div>
  `;
}


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

async function submitJobData(modal) {
    if (!validateModalFields(modal)) {
        return;
    }
    const user_id = await getUserId();
    const domain = await getSelectedDomain();

    const jobData = {
        user_id,
        company_name: modal.querySelector('#job-company').value.trim(),
        job_title: modal.querySelector('#job-title').value.trim(),
        location: modal.querySelector('#job-location').value.trim(),
        job_description: modal.querySelector('#job-description').value.trim(),
        job_url: modal.querySelector('#job-url').value.trim(),
        domain,
        timestamp: new Date().toISOString()
    };
    try {
        toggleModalFeedback('loading');

        const res = await fetch('https://job-logger-api.onrender.com/api/log_job', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(jobData)
        });

        const result = await res.json();
        if (result.status === 'duplicate') {
            toggleModalFeedback('duplicate', 'Logged this bad boy already. On to the next.');
            return;
        }
        if (result.status === 'limit_reached') {
            toggleModalFeedback('error', result.message || 'You reached your daily logging limit.');
            return;
        }

        if (!res.ok) throw new Error(result.message || 'Logging failed');


        console.log('✅ Logged:', result);
        toggleModalFeedback('success', 'Boom! Job locked & loaded. Next mission?');
    } catch (err) {
        console.error('❌ Logging error:', err);
        toggleModalFeedback('error', 'Failed to log job.');
    }
}


function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

function makeDraggable(modal) {
    const header = modal.querySelector('.side-modal-header');
    if (!header) return;

    let isDragging = false;
    let offsetX = 0, offsetY = 0;
    let animationFrameId;

    header.style.cursor = 'move';

    header.addEventListener('mousedown', (e) => {
        isDragging = true;
        offsetX = e.clientX - modal.getBoundingClientRect().left;
        offsetY = e.clientY - modal.getBoundingClientRect().top;
        modal.classList.remove('default-position');
        document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.clientX - offsetX;
        const y = e.clientY - offsetY;

        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        animationFrameId = requestAnimationFrame(() => {
            modal.style.left = x + 'px';
            modal.style.top = y + 'px';
            modal.style.position = 'fixed';
        });
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        document.body.style.userSelect = '';
    });
}

function createResizeHandle(modal) {
    const handle = document.createElement('div');
    handle.className = 'resize-indicator';

    handle.style.cssText = `
    position: absolute;
    width: 16px;
    height: 16px;
    bottom: 4px;
    right: 4px;
    cursor: se-resize;
    z-index: 10;
    background: rgba(0, 0, 0, 0.05);
    border-radius: 4px;
    user-select: none;
  `;

    let isResizing = false;
    let startX, startY, startWidth, startHeight;

    handle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        isResizing = true;
        startX = e.clientX;
        startY = e.clientY;
        const rect = modal.getBoundingClientRect();
        startWidth = rect.width;
        startHeight = rect.height;
        document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;

        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        const newWidth = Math.max(400, startWidth + deltaX);
        const newHeight = Math.max(300, startHeight + deltaY);

        modal.style.width = newWidth + 'px';
        modal.style.height = newHeight + 'px';
    });

    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            document.body.style.userSelect = '';
        }
    });

    return handle;
}

// ✅ Add helper functions for domain & user tracking

async function getUserId() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['userId'], async (result) => {
            if (result.userId) return resolve(result.userId);

            // Generate if missing
            const uid = 'user_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
            await chrome.storage.local.set({ userId: uid });
            resolve(uid);
        });
    });
}

async function getSelectedDomain() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['selectedDomain'], (result) => {
            resolve(result.selectedDomain || 'other');
        });
    });
}

function toggleModalFeedback(status = 'loading', message = '') {
    const overlay = document.querySelector('.modal-feedback-overlay');
    const spinner = overlay.querySelector('.spinner');
    const successIcon = overlay.querySelector('.feedback-icon.success');
    const errorIcon = overlay.querySelector('.feedback-icon.error');
    const duplicateIcon = overlay.querySelector('.feedback-icon.duplicate'); // NEW
    const text = overlay.querySelector('.feedback-message');

    // Reset visibility
    spinner.style.display = 'none';
    successIcon.style.display = 'none';
    errorIcon.style.display = 'none';
    duplicateIcon.style.display = 'none';  // NEW
    text.textContent = '';
    overlay.style.display = 'flex';

    if (status === 'loading') {
        spinner.style.display = 'block';
        text.textContent = 'Logging job...';
    } else if (status === 'success') {
        successIcon.style.display = 'block';
        text.textContent = message || 'Job logged successfully!';
        setTimeout(() => overlay.closest('.job-logger-side-modal')?.remove(), 1500);
    } else if (status === 'error') {
        errorIcon.style.display = 'block';
        text.textContent = message || 'Something went wrong. Please try again.';
        setTimeout(() => { overlay.style.display = 'none'; }, 2000);
    } else if (status === 'duplicate') {
        duplicateIcon.style.display = 'block';
        text.textContent = message || 'This job was already logged recently.';
        setTimeout(() => { overlay.style.display = 'none'; }, 2000);
    }
}


function validateModalFields(modal) {
    const validations = [
        { id: 'job-company', minLen: 2, message: 'Minimum 2 characters required' },
        { id: 'job-title', minLen: 3, message: 'Minimum 3 characters required' },
        { id: 'job-location', minLen: 1, message: 'Location cannot be empty' },
        { id: 'job-description', minLen: 50, message: 'Minimum 50 characters required' },
        { id: 'job-url', isUrl: true, message: 'Enter a valid URL (https://...)' }
    ];

    let isValid = true;

    validations.forEach(({ id, minLen, isUrl, message }) => {
        const el = modal.querySelector(`#${id}`);
        const value = el.value.trim();
        const errorText = el.nextElementSibling;

        let error = '';

        if (minLen && value.length < minLen) {
            error = message;
        } else if (isUrl && !isValidUrl(value)) {
            error = message;
        }

        if (error) {
            el.classList.add('error');
            errorText.classList.add('error-text');
            errorText.textContent = error;
            isValid = false;
        } else {
            el.classList.remove('error');
            errorText.classList.remove('error-text');
            errorText.textContent = el.getAttribute('data-help') || '';
        }
    });

    return isValid;
}


