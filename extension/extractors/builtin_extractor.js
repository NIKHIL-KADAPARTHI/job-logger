// 🏗️ Built In Production Extractor Module - Optimized
console.log('🏗️ Built In Production Extractor Module Loaded - Optimized Version');

class BuiltinExtractor {
    constructor() {
        this.currentSite = this.detectSite();
    }

    detectSite() {
        return window.location.hostname.toLowerCase().includes('builtin.com') ? 'builtin' : 'generic';
    }

    async extractJobData() {
        console.log('🏗️ Starting Built In production extraction...');
        const startTime = performance.now();

        const jobData = this.currentSite === 'builtin' ? await this.extractFromBuiltin() : await this.extractGeneric();

        jobData.extractionTime = Math.round(performance.now() - startTime);
        jobData.qualityScore = this.calculateQualityScore(jobData);
        jobData.qualityGrade = this.getQualityGrade(jobData.qualityScore);

        console.log('✅ Built In extraction completed:', {
            site: jobData.siteDetected,
            time: jobData.extractionTime + 'ms',
            quality: jobData.qualityGrade,
            score: jobData.qualityScore,
            descriptionLength: jobData.description?.length || 0
        });

        return jobData;
    }

    async extractFromBuiltin() {
        return {
            company: this.extractBuiltinCompany(),
            title: this.extractBuiltinTitle(),
            location: this.extractBuiltinLocation(),
            description: this.extractBuiltinDescription(),
            applicationUrl: this.extractApplicationUrl(),
            url: window.location.href,
            extractedAt: new Date().toISOString(),
            siteDetected: 'Built In',
            extractionMethod: 'builtin_production_optimized'
        };
    }

    extractBuiltinCompany() {
        const strategies = [
            this.extractCompanyFromJSONLD,
            this.extractCompanyFromSelectors,
            this.extractCompanyFromTitle
        ];

        for (const strategy of strategies) {
            try {
                const result = strategy.call(this);
                if (result && this.isValidCompany(result)) return this.cleanText(result);
            } catch (_) { }
        }
        return 'Company Name Not Found';
    }

    extractCompanyFromJSONLD() {
        return this.extractFromJSONLD(item => item.hiringOrganization?.name);
    }

    extractCompanyFromSelectors() {
        const selectors = ['.job-company', '.company-name', '[data-testid*="company"]', '[class*="company"]'];
        return this.extractFromElements(selectors, this.isValidCompany);
    }

    extractCompanyFromTitle() {
        const title = document.title;
        const patterns = [
            /^[^-]+-\s*(.+?)\s*\|\s*Built In/i,
            /-\s*([^-]+?)\s*\|\s*Built In/i,
            /at\s+(.+?)\s*\|/i,
            /-\s*(.+?)$/i
        ];

        for (const pattern of patterns) {
            const match = title.match(pattern);
            if (match?.[1]) {
                let company = match[1].replace(/\s*-.*$/, '').replace(/\s*\|.*$/, '').trim();
                if (this.isValidCompany(company)) return company;
            }
        }
        throw new Error('Company not found in title');
    }

    extractBuiltinTitle() {
        const strategies = [
            this.extractTitleFromJSONLD,
            this.extractTitleFromSelectors,
            this.extractTitleFromHTML
        ];

        for (const strategy of strategies) {
            try {
                const result = strategy.call(this);
                if (result?.length > 3) return this.cleanText(result);
            } catch (_) { }
        }
        return document.title.split(' - ')[0] || 'Job Title Not Found';
    }

    extractTitleFromJSONLD() {
        return this.extractFromJSONLD(item => item.title);
    }

    extractTitleFromSelectors() {
        const selectors = ['.job-title', '.job-header h1', '[data-testid*="job-title"]'];
        return this.extractFromElements(selectors, text => text.length > 3);
    }

    extractTitleFromHTML() {
        const selectors = ['h1', 'h2', '[class*="title"]'];
        return this.extractFromElements(selectors, text => text.length > 3 && text.length < 200);
    }

    extractBuiltinLocation() {
        const strategies = [
            this.extractLocationFromJSONLD,
            this.extractLocationFromSelectors,
            this.extractLocationFromText
        ];

        for (const strategy of strategies) {
            try {
                const result = strategy.call(this);
                if (result) return this.cleanText(result);
            } catch (_) { }
        }
        return '';
    }

    extractLocationFromJSONLD() {
        return this.extractFromJSONLD(item => this.parseLocationData(item.jobLocation));
    }

    extractLocationFromSelectors() {
        const selectors = ['.job-location', '[data-testid*="location"]', '[class*="location"]'];
        return this.extractFromElements(selectors, this.isValidLocation);
    }

    extractLocationFromText() {
        const match = document.body.textContent.match(/\b(?:Remote|Hybrid|[A-Z][a-z]+,\s*[A-Z]{2})\b/);
        if (match) return match[0];
        throw new Error('Location not found in text');
    }

    extractBuiltinDescription() {
        const strategies = [
            this.extractDescriptionFromJSONLD,
            this.extractDescriptionFromSelectors,
            this.extractDescriptionFromContent
        ];

        for (const strategy of strategies) {
            try {
                const result = strategy.call(this);
                if (result) return result;
            } catch (_) { }
        }
        return 'Job description could not be extracted';
    }

    extractDescriptionFromJSONLD() {
        return this.extractFromJSONLD(item => item.description?.length > 100 && this.cleanDescriptionText(item.description));
    }

    extractDescriptionFromSelectors() {
        const selectors = ['.job-description', '[class*="description"]', '[data-testid*="description"]'];
        return this.extractFromElements(selectors, text => text.length > 200, this.cleanDescriptionText);
    }

    extractDescriptionFromContent() {
        const selectors = ['.content', 'main', 'article'];
        return this.extractFromElements(selectors, text => text.length > 200, this.cleanDescriptionText);
    }

    extractApplicationUrl() {
        const selectors = [
            'a[href*="apply"]', '.apply-button a', '.apply-now a', '[data-testid*="apply"] a', 'a[title*="apply"]'
        ];

        for (const selector of selectors) {
            const el = document.querySelector(selector);
            if (el?.href && this.isValidUrl(el.href)) return el.href;
        }

        return window.location.href;
    }

    async extractGeneric() {
        return {
            company: 'Generic Company Test',
            title: 'Generic Title Test',
            location: 'Generic Location Test',
            description: 'Generic description test for non-Built In sites',
            applicationUrl: window.location.href,
            url: window.location.href,
            extractedAt: new Date().toISOString(),
            siteDetected: 'Generic Site',
            extractionMethod: 'generic_fallback'
        };
    }

    extractFromJSONLD(propertyFn) {
        const scripts = document.querySelectorAll('script[type="application/ld+json"]');
        for (const script of scripts) {
            try {
                const data = JSON.parse(script.textContent);
                const graph = data['@graph'] || [data];
                for (const item of graph) {
                    if (item['@type'] === 'JobPosting') {
                        const value = propertyFn(item);
                        if (value) return value;
                    }
                }
            } catch (_) { }
        }
        throw new Error('Property not found in JSON-LD');
    }

    extractFromElements(selectors, validator = () => true, cleaner = this.cleanText) {
        for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);
            for (const el of elements) {
                const text = el.textContent?.trim();
                if (text && validator.call(this, text)) return cleaner.call(this, text);
            }
        }
        throw new Error('Valid element not found');
    }

    parseLocationData(locationData) {
        if (Array.isArray(locationData)) locationData = locationData[0];
        if (typeof locationData === 'string') return locationData;
        if (!locationData?.address) return '';

        const { addressLocality, addressRegion, addressCountry } = locationData.address;
        return [addressLocality, addressRegion, addressCountry].filter(Boolean).join(', ');
    }

    cleanText(text) {
        return text?.trim().replace(/\s+/g, ' ').replace(/[\r\n\t\u00A0]+/g, ' ').trim();
    }

    cleanDescriptionText(text) {
        return text
            .replace(/<[^>]*>/g, '')
            .replace(/\s+/g, ' ')
            .replace(/[\r\n\t\u00A0]+/g, ' ')
            .replace(/^Back to jobs\s*/i, '')
            .replace(/Apply for this position.*$/i, '')
            .replace(/Submit application.*$/i, '')
            .replace(/By clicking Apply.*$/i, '')
            .replace(/Oops, something went wrong.*$/i, '')
            .trim();
    }

    isValidLocation(text) {
        const invalidPatterns = [/^fa-/i, /^icon/i, /^button/i, /built\s*in/i];
        return text && text.length > 1 && text.length < 100 && !invalidPatterns.some(p => p.test(text));
    }

    isValidCompany(company) {
        const cleaned = company.trim().toLowerCase();
        return cleaned.length >= 2 && cleaned.length <= 100 && !cleaned.includes('builtin') && !cleaned.includes('job');
    }

    isValidUrl(url) {
        try {
            return url.startsWith('http') && Boolean(new URL(url));
        } catch {
            return false;
        }
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

export default BuiltinExtractor;
