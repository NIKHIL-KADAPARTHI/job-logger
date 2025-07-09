// lever_extractor.js - Production Ready Extractor for Lever.co

class LeverExtractor {
    constructor() {
        this.currentSite = this.detectSite();
    }

    detectSite() {
        const hostname = window.location.hostname.toLowerCase();
        return hostname.includes('lever.co') ? 'lever' : 'generic';
    }

    async extractJobData() {
        let jobData = {};

        if (this.currentSite === 'lever') {
            jobData = await this.extractFromLever();
        } else {
            jobData = await this.extractGeneric();
        }

        return jobData;
    }

    async extractFromLever() {
        const jobData = {
            company: this.extractLeverCompany(),
            title: this.extractLeverTitle(),
            location: this.extractLeverLocation(),
            description: this.extractLeverDescription(),
            applicationUrl: window.location.href,
            url: window.location.href,
            extractedAt: new Date().toISOString(),
            siteDetected: 'Lever.co',
            extractionMethod: 'lever'
        };
        jobData.qualityScore = this.calculateQualityScore(jobData);
        jobData.qualityGrade = this.getQualityGrade(jobData.qualityScore);


        return jobData;
    }

    extractLeverCompany() {
        const strategies = [
            () => {
                const scripts = document.querySelectorAll('script[type="application/ld+json"]');
                for (const script of scripts) {
                    try {
                        const data = JSON.parse(script.textContent);
                        if (data['@type'] === 'JobPosting' && data.hiringOrganization) {
                            return data.hiringOrganization.name;
                        }
                    } catch (_) { }
                }
                throw new Error('No company in structured data');
            },

            () => {
                const url = window.location.href;
                const urlMatch = url.match(/jobs\.lever\.co\/([^\/]+)\//);
                if (urlMatch && urlMatch[1]) {
                    return this.formatCompanyName(urlMatch[1]);
                }
                throw new Error('No company found in URL');
            },

            () => {
                const title = document.title;
                const patterns = [
                    /(.+?)\s*-\s*Jobs/i,
                    /(.+?)\s*Careers/i,
                    /Jobs\s*at\s*(.+)/i,
                    /-\s*(.+)$/i
                ];

                for (const pattern of patterns) {
                    const match = title.match(pattern);
                    if (match && match[1]) {
                        const company = match[1].trim();
                        if (company.length > 1 && company.length < 100) {
                            return company;
                        }
                    }
                }

                throw new Error('No company found in page title');
            }
        ];

        for (let i = 0; i < strategies.length; i++) {
            try {
                const result = strategies[i]();
                if (result) return result;
            } catch (_) { }
        }

        return 'Company Name Not Found';
    }

    formatCompanyName(slug) {
        if (!slug) return 'Company Name Not Found';

        const specialCases = {
            'kraken123': 'Kraken',
            'ubiminds': 'Ubiminds',
            'contentsquare': 'ContentSquare',
            'orum': 'Orum',
            'comply': 'COMPLY',
            'mistral': 'Mistral AI',
            'apolloresearch': 'Apollo Research',
            'veeva': 'Veeva Systems',
            'dnb': 'Dun & Bradstreet',
            'swissborg': 'SwissBorg'
        };

        if (specialCases[slug.toLowerCase()]) {
            return specialCases[slug.toLowerCase()];
        }

        return slug
            .split(/[-_]/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    extractLeverTitle() {
        const strategies = [
            () => {
                const scripts = document.querySelectorAll('script[type="application/ld+json"]');
                for (const script of scripts) {
                    try {
                        const data = JSON.parse(script.textContent);
                        if (data['@type'] === 'JobPosting' && data.title) {
                            return data.title;
                        }
                    } catch (_) { }
                }
                throw new Error('No title in structured data');
            },

            () => {
                const selectors = [
                    '.posting-headline',
                    '.posting-title',
                    '[class*="posting-headline"]',
                    '[class*="posting-title"]'
                ];

                for (const selector of selectors) {
                    const element = document.querySelector(selector);
                    if (element) {
                        const text = element.textContent?.trim();
                        if (text && text.length > 3) {
                            return text;
                        }
                    }
                }

                throw new Error('No title found with Lever selectors');
            },

            () => {
                const selectors = ['h1', 'h2', '.job-title', '[class*="title"]'];

                for (const selector of selectors) {
                    const elements = document.querySelectorAll(selector);
                    for (const element of elements) {
                        const text = element.textContent?.trim();
                        if (text && text.length > 3 && text.length < 200) {
                            return text;
                        }
                    }
                }

                throw new Error('No title found in HTML');
            }
        ];

        for (let i = 0; i < strategies.length; i++) {
            try {
                const result = strategies[i]();
                if (result) return result;
            } catch (_) { }
        }

        return document.title.split(' - ')[0] || 'Job Title Not Found';
    }

    extractLeverLocation() {
        const strategies = [
            () => {
                const scripts = document.querySelectorAll('script[type="application/ld+json"]');
                for (const script of scripts) {
                    try {
                        const data = JSON.parse(script.textContent);
                        if (data['@type'] === 'JobPosting' && data.jobLocation) {
                            const location = data.jobLocation;
                            let locationText = '';

                            if (Array.isArray(location) && location.length > 0) {
                                const loc = location[0];
                                if (loc.address) {
                                    const addr = loc.address;
                                    locationText = [
                                        addr.addressLocality,
                                        addr.addressRegion,
                                        addr.addressCountry
                                    ].filter(Boolean).join(', ');
                                } else if (typeof loc === 'string') {
                                    locationText = loc;
                                }
                            } else if (location.address) {
                                const addr = location.address;
                                locationText = [
                                    addr.addressLocality,
                                    addr.addressRegion,
                                    addr.addressCountry
                                ].filter(Boolean).join(', ');
                            } else if (typeof location === 'string') {
                                locationText = location;
                            }

                            if (locationText) return locationText;
                        }
                    } catch (_) { }
                }

                throw new Error('No location in structured data');
            },

            () => {
                const selectors = [
                    '.posting-categories',
                    '.posting-location',
                    '[class*="posting-categories"]',
                    '[class*="posting-location"]',
                    '[class*="location"]'
                ];

                for (const selector of selectors) {
                    const elements = document.querySelectorAll(selector);
                    for (const element of elements) {
                        const text = element.textContent?.trim();
                        if (text && text.length > 1 && text.length < 100 &&
                            !text.toLowerCase().includes('department') &&
                            !text.toLowerCase().includes('team')) {
                            return text;
                        }
                    }
                }

                throw new Error('No location found with Lever selectors');
            },

            () => {
                const selectors = [
                    '.location',
                    '.job-location',
                    '[class*="location"]',
                    '[class*="address"]'
                ];

                for (const selector of selectors) {
                    const elements = document.querySelectorAll(selector);
                    for (const element of elements) {
                        const text = element.textContent?.trim();
                        if (text && text.length > 1 && text.length < 100) {
                            return text;
                        }
                    }
                }

                throw new Error('No location found with generic selectors');
            }
        ];

        for (let i = 0; i < strategies.length; i++) {
            try {
                const result = strategies[i]();
                if (result) return result;
            } catch (_) { }
        }

        return '';
    }

    extractLeverDescription() {
        const strategies = [
            () => {
                const scripts = document.querySelectorAll('script[type="application/ld+json"]');
                for (const script of scripts) {
                    try {
                        const data = JSON.parse(script.textContent);
                        if (data['@type'] === 'JobPosting' && data.description) {
                            const cleaned = this.cleanDescriptionText(data.description);
                            if (cleaned.length > 100) return cleaned;
                        }
                    } catch (_) { }
                }

                throw new Error('No description in structured data');
            },

            () => {
                const selectors = [
                    '.posting-content',
                    '.posting-requirements',
                    '.posting-description',
                    '[class*="posting-content"]',
                    '[class*="posting-requirements"]',
                    '[class*="posting-description"]'
                ];

                for (const selector of selectors) {
                    const elements = document.querySelectorAll(selector);
                    for (const element of elements) {
                        const text = element.textContent?.trim();
                        if (text && text.length > 200) {
                            const cleaned = this.cleanDescriptionText(text);
                            if (cleaned.length > 200) return cleaned;
                        }
                    }
                }

                throw new Error('No description found with Lever selectors');
            },

            () => {
                const selectors = [
                    '.job-description',
                    '.description',
                    '.content',
                    '[class*="description"]',
                    '[class*="content"]',
                    '.section-wrapper',
                    'main'
                ];

                for (const selector of selectors) {
                    const elements = document.querySelectorAll(selector);
                    for (const element of elements) {
                        const text = element.textContent?.trim();
                        if (text && text.length > 200) {
                            const cleaned = this.cleanDescriptionText(text);
                            if (cleaned.length > 200) return cleaned;
                        }
                    }
                }

                throw new Error('No description found with generic selectors');
            }
        ];

        for (let i = 0; i < strategies.length; i++) {
            try {
                const result = strategies[i]();
                if (result) return result;
            } catch (_) { }
        }

        return 'Job description could not be extracted';
    }

    cleanDescriptionText(text) {
        return text
            .replace(/<[^>]*>/g, '')
            .replace(/\s+/g, ' ')
            .replace(/[\r\n\t]/g, ' ')
            .replace(/\u00A0/g, ' ')
            .replace(/^Back to jobs\s*/i, '')
            .replace(/Apply for this position.*$/i, '')
            .replace(/Submit application.*$/i, '')
            .trim();
    }

    async extractGeneric() {
        return {
            company: 'Generic Company Test',
            title: 'Generic Title Test',
            location: 'Generic Location Test',
            description: 'Generic description test',
            applicationUrl: window.location.href,
            url: window.location.href,
            extractedAt: new Date().toISOString(),
            siteDetected: 'Generic Site',
            extractionMethod: 'generic'
        };
    }
    calculateQualityScore({ company, title, location, description }) {
        let score = 0;
        if (company && company !== 'Company Name Not Found') score += 25;
        if (title && title !== 'Job Title Not Found') score += 30;
        if (location) score += 20;
        if (description && description.length >= 100 && description !== 'Job description could not be extracted') score += 25;
        return score;
    }

    getQualityGrade(score) {
        if (score >= 90) return 'A+ (Excellent)';
        if (score >= 80) return 'A (Very Good)';
        if (score >= 70) return 'B (Good)';
        if (score >= 60) return 'C (Fair)';
        if (score >= 50) return 'D (Poor)';
        return 'F (Failed)';
    }
}

export default LeverExtractor;