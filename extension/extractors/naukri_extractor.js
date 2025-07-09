// naukri_extractor.js - Cleaned Production Version Focused on Naukri.com

class NaukriExtractor {
    constructor() {
        this.currentSite = this.detectSite();
    }

    detectSite() {
        const hostname = window.location.hostname.toLowerCase();
        return hostname.includes('naukri.com') ? 'naukri' : 'unsupported';
    }

    async extractJobData() {
        if (this.currentSite !== 'naukri') {
            return {
                company: 'Naukri Extraction Not Supported On This Domain',
                title: '',
                location: '',
                description: '',
                applicationUrl: window.location.href,
                url: window.location.href,
                extractedAt: new Date().toISOString(),
                siteDetected: 'Unsupported',
                extractionMethod: 'naukri_only'
            };
        }

        const jobData = {
            company: this.extractNaukriCompanyImproved(),
            title: this.extractNaukriTitleImproved(),
            location: this.extractNaukriLocationImproved(),
            description: this.extractNaukriDescriptionImproved(),
            applicationUrl: window.location.href,
            url: window.location.href,
            extractedAt: new Date().toISOString(),
            siteDetected: 'Naukri.com',
            extractionMethod: 'naukri_only'
        };

        jobData.qualityScore = this.calculateQualityScore(jobData);
        jobData.qualityGrade = this.getQualityGrade(jobData.qualityScore);

        return jobData;
    }

    extractNaukriCompanyImproved() {
        const strategies = [
            () => {
                const compNameElements = document.querySelectorAll('[class*="jd-header-comp-name"], [class*="comp-name"]');
                for (const element of compNameElements) {
                    const text = element.textContent?.trim();
                    const cleanCompany = this.parseCompanyName(text);
                    if (cleanCompany) return cleanCompany;
                }
                throw new Error('Not found in company CSS classes');
            },

            () => {
                const jobHeader = document.querySelector('[id="job_header"]');
                if (jobHeader) {
                    const headerText = jobHeader.textContent;
                    const companyMatch = headerText.match(/Engineer([A-Za-z\s]+?)[\d\.]/);
                    if (companyMatch && companyMatch[1]) {
                        return companyMatch[1].trim();
                    }
                }
                throw new Error('Not found in job header');
            },

            () => {
                const title = document.title;
                const parts = title.split(' - ');
                if (parts.length >= 3) {
                    const potentialCompany = parts[2].trim();
                    if (potentialCompany && potentialCompany.length > 1 && potentialCompany.length < 100) {
                        return potentialCompany;
                    }
                }
                throw new Error('Not found in page title');
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

    parseCompanyName(text) {
        if (!text) return null;

        let cleaned = text
            .replace(/\d+\.\d+.*?Reviews?/i, '')
            .replace(/\d+\+?\s*Reviews?/i, '')
            .replace(/Reviews?/i, '')
            .replace(/Employees['’]?\s*choice/i, '')
            .replace(/\d+\.\d+/g, '')
            .replace(/\s+/g, ' ')
            .trim();

        if (
            cleaned.length >= 2 &&
            cleaned.length <= 100 &&
            !cleaned.toLowerCase().includes('naukri') &&
            !cleaned.toLowerCase().includes('job') &&
            !cleaned.toLowerCase().includes('company info') &&
            !cleaned.toLowerCase().includes('about')
        ) {
            return cleaned;
        }

        return null;
    }

    extractNaukriTitleImproved() {
        const selectors = [
            'h1[class*="jd-header-title"]',
            'h1[class*="title"]',
            'h1',
            '[id="job_header"] h1'
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

        return document.title.split(' - ')[0] || 'Job Title Not Found';
    }

    extractNaukriLocationImproved() {
        const strategies = [
            () => {
                const selectors = [
                    '[class*="location"]',
                    '[class*="jhc__location"]'
                ];

                for (const selector of selectors) {
                    const elements = document.querySelectorAll(selector);
                    for (const element of elements) {
                        const text = element.textContent?.trim();
                        if (
                            text &&
                            text.length > 1 &&
                            text.length < 100 &&
                            !text.toLowerCase().includes('icon') &&
                            !text.toLowerCase().includes('get real-time')
                        ) {
                            return text;
                        }
                    }
                }
                throw new Error('Not found with CSS');
            },

            () => {
                const title = document.title;
                const parts = title.split(' - ');
                if (parts.length >= 2) {
                    let locationPart = parts[1].trim();
                    if (locationPart.includes('/')) {
                        locationPart = locationPart.split('/')[0];
                    }
                    if (locationPart && locationPart.length > 1) {
                        return locationPart;
                    }
                }
                throw new Error('Not found in title');
            }
        ];

        for (let i = 0; i < strategies.length; i++) {
            try {
                const result = strategies[i]();
                if (result) return result;
            } catch (_) { }
        }

        return 'Location Not Found';
    }

    extractNaukriDescriptionImproved() {
        const strategies = [
            () => {
                const selectors = [
                    '[class*="job-desc"]',
                    '[class*="description"]',
                    '[class*="desc-container"]'
                ];

                for (const selector of selectors) {
                    const elements = document.querySelectorAll(selector);
                    for (const element of elements) {
                        const rawText = element.textContent?.trim();
                        if (rawText && rawText.length > 100) {
                            const cleanedDescription = this.cleanDescription(rawText);
                            if (cleanedDescription.length > 100) {
                                return cleanedDescription;
                            }
                        }
                    }
                }
                throw new Error('Not found with CSS');
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

    cleanDescription(text) {
        return text
            .replace(/^Job description\s*/i, '')
            .replace(/\s+/g, ' ')
            .replace(/[\r\n\t]/g, ' ')
            .trim();
    }

    calculateQualityScore({ company, title, location, description }) {
        let score = 0;
        if (company && company !== 'Company Name Not Found') score += 25;
        if (title && title !== 'Job Title Not Found') score += 30;
        if (location && location !== 'Location Not Found') score += 20;
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

export default NaukriExtractor;
