// smartrecruiters_extractor.js - Improved and Fixed Version

class SmartRecruitersExtractor {
    constructor() {
        this.currentSite = this.detectSite();
    }

    detectSite() {
        const hostname = window.location.hostname.toLowerCase();
        return hostname.includes('smartrecruiters.com') ? 'smartrecruiters' : 'unsupported';
    }

    async extractJobData() {
        if (this.currentSite !== 'smartrecruiters') {
            return {
                company: 'SmartRecruiters Extraction Not Supported On This Domain',
                title: '',
                location: '',
                description: '',
                applicationUrl: window.location.href,
                url: window.location.href,
                extractedAt: new Date().toISOString(),
                siteDetected: 'Unsupported',
                extractionMethod: 'smartrecruiters_only'
            };
        }

        const jobData = {
            company: this.extractCompany(),
            title: this.extractTitle(),
            location: this.extractLocation(),
            description: this.extractDescription(),
            applicationUrl: window.location.href,
            url: window.location.href,
            extractedAt: new Date().toISOString(),
            siteDetected: 'SmartRecruiters',
            extractionMethod: 'smartrecruiters_only'
        };
        jobData.qualityScore = this.calculateQualityScore(jobData);
        jobData.qualityGrade = this.getQualityGrade(jobData.qualityScore);


        return jobData;
    }

    extractCompany() {
        const companyMeta = document.querySelector("meta[property='og:site_name']");
        if (companyMeta) {
            const company = companyMeta.getAttribute('content')?.trim();
            if (company && company.length > 1 && company.length < 100) {
                return company;
            }
        }

        return 'Company Name Not Found';
    }

    extractTitle() {
        const titleMeta = document.querySelector("meta[property='og:title']");
        if (titleMeta) {
            const title = titleMeta.getAttribute('content')?.trim();
            if (title && title.length > 2) {
                return title;
            }
        }

        const h1 = document.querySelector('h1');
        if (h1) {
            return h1.textContent.trim();
        }

        return 'Title Not Found';
    }

    extractLocation() {
        const twitterLoc = document.querySelector("meta[name='twitter:data1']");
        if (twitterLoc) {
            return twitterLoc.getAttribute('value')?.trim() || twitterLoc.getAttribute('content')?.trim() || 'Location Not Found';
        }

        return 'Location Not Found';
    }

    extractDescription() {
        // Search inside main content blocks
        const candidateSelectors = [
            '[class*="jobad-main job"]',
            '[id*="job"]',
            '[class*="description"]',
            '[class*="jobad"]',
            '[class*="job-description"]'
        ];

        for (const selector of candidateSelectors) {
            const el = document.querySelector(selector);
            if (el) {
                const text = el.innerText?.trim();
                if (text && text.length > 200) {
                    return this.cleanDescription(text);
                }
            }
        }

        // Fallback: Use <meta property="og:description">
        const metaDesc = document.querySelector("meta[property='og:description']");
        if (metaDesc) {
            return metaDesc.getAttribute("content")?.trim();
        }

        return 'Job description could not be extracted';
    }

    cleanDescription(text) {
        return text
            .replace(/if\s*\(.*?MicroMessenger.*?\{.*?\}/gs, '') // remove tracking js
            .replace(/\s{2,}/g, ' ')
            .replace(/[\t\r\n]+/g, '\n')
            .trim();
    }
    calculateQualityScore({ company, title, location, description }) {
        let score = 0;
        if (company && company !== 'Company Name Not Found') score += 25;
        if (title && title !== 'Title Not Found') score += 30;
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

export default SmartRecruitersExtractor;
