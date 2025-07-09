// restricted_sites.js - Manage sites that don't allow scraping

const RESTRICTED_SITES = [
    // Major job boards with strict anti-scraping
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
        reason: 'Scraping not permitted'
    },
    {
        domain: 'monster.com',
        name: 'Monster',
        reason: 'Terms of Service violation - Monster prohibits scraping'
    },
    {
        domain: 'careerbuilder.com',
        name: 'CareerBuilder',
        reason: 'Automated access detection - May block IP address'
    }
];

// Check if current site is restricted
function isRestrictedSite(url = window.location.href) {
    const hostname = new URL(url).hostname.toLowerCase();

    return RESTRICTED_SITES.find(site =>
        hostname.includes(site.domain) ||
        hostname.includes(site.domain.replace('.com', ''))
    );
}

// Get restriction info for current site
function getRestrictionInfo() {
    return isRestrictedSite();
}

// Export functions
window.jobLoggerRestricted = {
    isRestrictedSite,
    getRestrictionInfo,
    RESTRICTED_SITES
};