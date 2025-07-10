// popup.js - Extension Popup Logic

const SERVER_URL = 'https://job-logger-api.onrender.com';

// DOM elements
const connectionStatus = document.getElementById('connection-status');
const domainSelect = document.getElementById('domain-select');
const saveButton = document.getElementById('save-settings');
const jobsCount = document.getElementById('jobs-count');

// Initialize popup when opened
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🔧 Job Logger Popup Opened');

    // Test server connection
    await checkServerConnection();

    // Load domains from server
    await loadDomains();

    // Load saved settings
    await loadSavedSettings();

    // Fetch today's job count
    await fetchTodayJobCount();

    // Setup event listeners
    setupEventListeners();
});

// Check if server is running
async function checkServerConnection() {
    try {
        const response = await fetch(`${SERVER_URL}/api/health`);
        const data = await response.json();

        if (data.status === 'healthy') {
            connectionStatus.textContent = '✅ Connected';
            connectionStatus.className = 'status-connected';
            console.log('✅ Server connection successful');
        } else {
            throw new Error('Server not healthy');
        }
    } catch (error) {
        connectionStatus.textContent = '❌ Server Offline';
        connectionStatus.className = 'status-disconnected';
        console.error('❌ Server connection failed:', error);
    }
}

// Load domains from server
async function loadDomains() {
    try {
        const response = await fetch(`${SERVER_URL}/api/domains`);
        const data = await response.json();

        if (data.status === 'success') {
            populateDomainDropdown(data.domains);
            console.log(`📋 Loaded ${data.domains.length} domains`);
        } else {
            throw new Error('Failed to load domains');
        }
    } catch (error) {
        console.error('❌ Failed to load domains:', error);
        domainSelect.innerHTML = '<option value="">Failed to load domains</option>';
    }
}

// Populate domain dropdown
function populateDomainDropdown(domains) {
    domainSelect.innerHTML = '<option value="">Select a domain...</option>';

    domains.forEach(domain => {
        const option = document.createElement('option');
        option.value = domain.id;
        option.textContent = domain.display_name;
        domainSelect.appendChild(option);
    });

    // Enable save button once domains are loaded
    saveButton.disabled = false;
}

// Load saved settings from Chrome storage
async function loadSavedSettings() {
    try {
        const result = await chrome.storage.local.get(['selectedDomain', 'displayMode', 'userId']);

        if (result.selectedDomain) {
            domainSelect.value = result.selectedDomain;
        }

        if (result.displayMode) {
            const radioButton = document.querySelector(`input[name="display-mode"][value="${result.displayMode}"]`);
            if (radioButton) {
                radioButton.checked = true;
            }
        }

        // Generate user ID if not exists
        if (!result.userId) {
            const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            await chrome.storage.local.set({ userId: userId });
            console.log('🆔 Generated new user ID:', userId);
        } else {
            console.log('🆔 Existing user ID:', result.userId);
        }

    } catch (error) {
        console.error('❌ Failed to load settings:', error);
    }
}

// Setup event listeners
function setupEventListeners() {
    // Save settings button
    saveButton.addEventListener('click', saveSettings);

    // Auto-enable save button when settings change
    domainSelect.addEventListener('change', () => {
        saveButton.disabled = false;
    });

    document.querySelectorAll('input[name="display-mode"]').forEach(radio => {
        radio.addEventListener('change', () => {
            saveButton.disabled = false;
        });
    });
}

// Save settings to Chrome storage
async function saveSettings() {
    try {
        const selectedDomain = domainSelect.value;
        const displayMode = document.querySelector('input[name="display-mode"]:checked').value;

        if (!selectedDomain) {
            alert('Please select a domain');
            return;
        }

        // Save to Chrome storage
        await chrome.storage.local.set({
            selectedDomain: selectedDomain,
            displayMode: displayMode,
            lastUpdated: new Date().toISOString()
        });

        // Update button state
        saveButton.disabled = true;
        saveButton.textContent = '✅ Saved!';

        // Reset button text after 2 seconds
        setTimeout(() => {
            saveButton.textContent = 'Save Settings';
        }, 2000);

        alert(`✅ Settings saved!\n\nYou're now logging jobs for domain: "${domainSelect.options[domainSelect.selectedIndex].text}"\n\nYou can start browsing job sites and Log the jobs you find.`);

        // Notify content scripts about the change
        notifyContentScripts();
        // ✅ Close popup after saving
        window.close();


    } catch (error) {
        console.error('❌ Failed to save settings:', error);
        alert('Failed to save settings');
    }
}

// Notify content scripts about setting changes
async function notifyContentScripts() {
    try {
        const tabs = await chrome.tabs.query({});
        tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, {
                type: 'SETTINGS_UPDATED'
            }).catch(() => {
                // Ignore errors for tabs that don't have content script
            });
        });
    } catch (error) {
        console.error('❌ Failed to notify content scripts:', error);
    }
}

async function fetchTodayJobCount() {
    try {
        const result = await chrome.storage.local.get(['userId']);
        const userId = result.userId;
        if (!userId) return;

        const todayUTC = new Date().toISOString().split('T')[0]; // e.g., "2025-07-09"
        const url = `${SERVER_URL}/api/user_job_count?user_id=${userId}&date=${todayUTC}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'success') {
            jobsCount.textContent = `${data.count} jobs logged today`;
            console.log(`📊 Logged today: ${data.count}`);
        } else {
            jobsCount.textContent = 'Unable to fetch job count';
        }
    } catch (error) {
        console.error('❌ Error fetching job count:', error);
        jobsCount.textContent = 'Error fetching count';
    }
}

