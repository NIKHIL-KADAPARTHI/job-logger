// background.js - Extension background service worker
console.log('🔧 Job Logger Background Script Started');

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('🎉 Job Logger Extension Installed');
    } else if (details.reason === 'update') {
        console.log('🔄 Job Logger Extension Updated');
    }
});

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
    console.log('🚀 Job Logger Extension Started');
});

// Basic message handling (we'll expand this in later phases)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('📨 Background received message:', message);
    sendResponse({ status: 'received' });
});