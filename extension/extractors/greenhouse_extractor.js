// greenhouse_extractor.js - Production Version of Greenhouse Debug Extractor

class GreenhouseExtractor {
    constructor() {
        this.currentSite = this.detectSite();
    }

    detectSite() {
        const hostname = window.location.hostname.toLowerCase();
        if (hostname.includes('greenhouse.io')) return 'greenhouse';
        return 'generic';
    }

    async extractJobData() {
        let jobData = {};

        if (this.currentSite === 'greenhouse') {
            jobData = await this.extractFromGreenhouse();
        } else {
            jobData = await this.extractGeneric();
        }

        return jobData;
    }

    async extractFromGreenhouse() {
        const jobData = {
            company: this.extractGreenhouseCompany(),
            title: this.extractGreenhouseTitle(),
            location: this.extractGreenhouseLocation(),
            description: this.extractGreenhouseDescription(),
            applicationUrl: window.location.href,
            url: window.location.href,
            extractedAt: new Date().toISOString(),
            siteDetected: 'Greenhouse.io',
            extractionMethod: 'greenhouse_debug_final'
        };
        jobData.qualityScore = this.calculateQualityScore(jobData);
        jobData.qualityGrade = this.getQualityGrade(jobData.qualityScore);


        return jobData;
    }

    extractGreenhouseCompany() {
        const strategies = [
            () => {
                const url = window.location.href;
                const urlMatch = url.match(/job-boards\.greenhouse\.io\/([^\/]+)\//);
                if (urlMatch && urlMatch[1]) {
                    const companySlug = urlMatch[1];
                    return this.formatCompanyName(companySlug);
                }

                const hostname = window.location.hostname;
                if (hostname.includes('.greenhouse.io') && !hostname.includes('job-boards')) {
                    const companySlug = hostname.split('.')[0];
                    return this.formatCompanyName(companySlug);
                }

                throw new Error('No company found in URL');
            },

            () => {
                const title = document.title;
                const atMatch = title.match(/at\s+(.+)$/i);
                if (atMatch && atMatch[1]) {
                    return atMatch[1].trim();
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
            'getwellnetwork': 'Get Well Network',
            'zenoti': 'Zenoti',
            'postman': 'Postman'
        };

        if (specialCases[slug.toLowerCase()]) {
            return specialCases[slug.toLowerCase()];
        }

        return slug
            .split(/[-_]/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    extractGreenhouseTitle() {
        const strategies = [
            () => {
                const titleElement = document.querySelector('.job__title');
                if (titleElement) {
                    const text = titleElement.textContent?.trim();
                    if (text) return this.cleanJobTitle(text);
                }
                throw new Error('No .job__title element found');
            },

            () => {
                const h1Element = document.querySelector('h1');
                if (h1Element) {
                    const text = h1Element.textContent?.trim();
                    if (text && text.length > 3) return text;
                }
                throw new Error('No valid h1 found');
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

    cleanJobTitle(text) {
        if (!text || text.length < 3) return 'Job Title Not Found';

        // Step 1: Use the known location to clean up the title
        const locationText = this.extractGreenhouseLocation();
        if (locationText && text.includes(locationText)) {
            let cleaned = text.replace(locationText, '').trim();
            cleaned = cleaned.replace(/[-–—|:,]+$/, '').trim(); // Remove any trailing symbols
            return cleaned;
        }

        // Step 2: Use fallback pattern (regex) as before
        const generalPattern = /(.+?)[|,\-–—]\s*[A-Z][a-z\s]+$/;
        const match = text.match(generalPattern);
        if (match && match[1]) {
            return match[1].trim();
        }

        // Step 3: Return as-is if nothing else works
        return text;
    }

    extractGreenhouseLocation() {
        const strategies = [
            () => {
                const locationElement = document.querySelector('.job__location');
                if (locationElement) {
                    const text = locationElement.textContent?.trim();
                    if (text && text.length > 1) return text;
                }
                throw new Error('No .job__location element found');
            },

            () => {
                const titleElement = document.querySelector('.job__title');
                if (titleElement) {
                    const text = titleElement.textContent?.trim();
                    const locationMatch = text.match(/([A-Z][a-z]+,\s*[A-Z][a-z]+(?:,\s*[A-Z][a-z]+)?)/);
                    if (locationMatch && locationMatch[1]) return locationMatch[1].trim();
                }
                throw new Error('No location found in title');
            },

            () => {
                const scripts = document.querySelectorAll('script[type="application/ld+json"]');

                for (const script of scripts) {
                    try {
                        const data = JSON.parse(script.textContent);

                        if (data['@type'] === 'JobPosting' && data.jobLocation) {
                            const location = data.jobLocation;
                            let locationText = '';
                            if (location.address) {
                                const addr = location.address;
                                locationText = [addr.addressLocality, addr.addressRegion, addr.addressCountry]
                                    .filter(Boolean).join(', ');
                            } else if (typeof location === 'string') {
                                locationText = location;
                            }

                            if (locationText) return locationText;
                        }
                    } catch (_) { }
                }

                throw new Error('No location in structured data');
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

    extractGreenhouseDescription() {
        const strategies = [
            () => {
                const descriptionElement = document.querySelector('.job__description.body');
                if (descriptionElement) {
                    const text = descriptionElement.textContent?.trim();
                    if (text && text.length > 100) return this.cleanDescriptionText(text);
                }
                throw new Error('No .job__description.body element found');
            },

            () => {
                const descriptionElement = document.querySelector('.job__description');
                if (descriptionElement) {
                    const text = descriptionElement.textContent?.trim();
                    if (text && text.length > 100) return this.cleanDescriptionText(text);
                }
                throw new Error('No .job__description element found');
            },

            () => {
                const scripts = document.querySelectorAll('script[type="application/ld+json"]');
                for (const script of scripts) {
                    try {
                        const data = JSON.parse(script.textContent);
                        if (data['@type'] === 'JobPosting' && data.description) {
                            const description = data.description;
                            if (description.length > 100) return this.cleanDescriptionText(description);
                        }
                    } catch (_) { }
                }
                throw new Error('No description in structured data');
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
            .replace(/Apply for this job.*$/i, '')
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
            extractionMethod: 'debug'
        };
    }
    calculateQualityScore({ company, title, location, description }) {
        let score = 0;
        if (company && company !== 'Company Name Not Found') score += 25;
        if (title && title !== 'Job Title Not Found') score += 30;
        if (location && location !== '') score += 20;
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
export default GreenhouseExtractor;