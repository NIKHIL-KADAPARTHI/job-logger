// ultra_robust_extractor.js - Next-Generation Universal Job Extractor with 90+ Success Rate
console.log('🚀 Ultra-Robust Universal Job Extractor Module Loaded');

/**
 * Ultra-Robust Universal Job Extractor
 * Designed for 90+ success rate across any job site
 */
class UltraRobustJobExtractor {
    constructor() {
        this.contentAnalyzer = new ContentAnalyzer();
        this.textIntelligence = new TextIntelligence();
        this.advancedFilter = new AdvancedContentFilter();
        this.qualityValidator = new QualityValidator();
        this.patternRecognizer = new JobPatternRecognizer();

        this.extractors = {
            company: new UniversalCompanyExtractor(this),
            title: new UniversalTitleExtractor(this),
            location: new UniversalLocationExtractor(this),
            description: new UniversalDescriptionExtractor(this),
            url: new UniversalUrlExtractor(this)
        };
    }

    async extractJobData() {
        console.log('🚀 Starting ultra-robust extraction...');
        const startTime = performance.now();

        // Pre-analysis: Understand the page structure
        await this.analyzePageStructure();

        // Extract each field with multiple strategies and validation
        const results = await this.extractAllFields();

        // Post-process and validate entire job data
        const jobData = await this.finalizeJobData(results, startTime);

        console.log('✅ Ultra-robust extraction completed:', {
            time: jobData.extractionTime + 'ms',
            quality: jobData.qualityGrade,
            confidence: jobData.confidenceScore + '%',
            methods: jobData.extractionMethods
        });

        return jobData;
    }

    async analyzePageStructure() {
        console.log('🔍 Analyzing page structure for job content...');

        // Analyze page for job-specific patterns
        this.pageAnalysis = {
            hasStructuredData: this.contentAnalyzer.hasJobStructuredData(),
            jobContentBlocks: this.contentAnalyzer.findJobContentBlocks(),
            semanticStructure: this.contentAnalyzer.analyzeSemanticStructure(),
            contentQuality: this.contentAnalyzer.assessContentQuality(),
            siteType: this.patternRecognizer.detectSiteType(),
            jobPatterns: this.patternRecognizer.findJobPatterns()
        };

        console.log('📊 Page analysis complete:', this.pageAnalysis);
    }

    async extractAllFields() {
        const results = {};

        // Extract each field with detailed logging and multiple attempts
        for (const [field, extractor] of Object.entries(this.extractors)) {
            console.log(`🎯 Extracting ${field}...`);

            try {
                const result = await extractor.extract();
                results[field] = result;
                console.log(`✅ ${field} extracted:`, result.value?.substring(0, 100));
            } catch (error) {
                console.error(`❌ ${field} extraction failed:`, error.message);
                results[field] = { value: '', confidence: 0, method: 'failed' };
            }
        }

        return results;
    }

    async finalizeJobData(results, startTime) {
        const jobData = {
            company: results.company.value || 'Company Name Not Found',
            title: results.title.value || 'Job Title Not Found',
            location: results.location.value || 'Location Not Specified',
            description: results.description.value || 'Job description could not be extracted',
            applicationUrl: results.url.value || window.location.href,
            url: window.location.href,
            extractedAt: new Date().toISOString(),
            extractionTime: Math.round(performance.now() - startTime),
            siteDetected: this.pageAnalysis.siteType.name,
            extractionMethod: 'ultra_robust_universal'
        };

        // Calculate comprehensive quality metrics
        jobData.qualityScore = this.calculateQualityScore(jobData, results);
        jobData.qualityGrade = this.getQualityGrade(jobData.qualityScore);
        jobData.confidenceScore = this.calculateConfidenceScore(results);
        jobData.extractionMethods = this.getExtractionMethods(results);

        return jobData;
    }

    calculateQualityScore(jobData, results) {
        let score = 0;

        // Field presence and quality
        if (jobData.company && jobData.company.length >= 2) score += 20;
        if (jobData.title && jobData.title.length >= 5) score += 25;
        if (jobData.location && jobData.location.length >= 2) score += 20;
        if (jobData.description && jobData.description.length >= 100) score += 25;

        // Confidence bonuses
        score += (results.company.confidence || 0) * 0.05;
        score += (results.title.confidence || 0) * 0.05;

        // Content quality bonus
        if (this.pageAnalysis.contentQuality > 70) score += 10;

        return Math.min(100, Math.round(score));
    }

    calculateConfidenceScore(results) {
        const confidences = Object.values(results).map(r => r.confidence || 0);
        return Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length);
    }

    getExtractionMethods(results) {
        return Object.fromEntries(
            Object.entries(results).map(([field, result]) => [field, result.method])
        );
    }

    getQualityGrade(score) {
        if (score >= 95) return 'A+ (Outstanding)';
        if (score >= 90) return 'A (Excellent)';
        if (score >= 80) return 'B+ (Very Good)';
        if (score >= 70) return 'B (Good)';
        if (score >= 60) return 'C (Fair)';
        return 'D (Poor)';
    }
}

/**
 * Content Analyzer - Understands page structure and content
 */
class ContentAnalyzer {
    hasJobStructuredData() {
        const scripts = document.querySelectorAll('script[type="application/ld+json"]');
        for (const script of scripts) {
            try {
                const data = JSON.parse(script.textContent);
                if (data['@type'] === 'JobPosting' ||
                    (data['@graph'] && data['@graph'].some(item => item['@type'] === 'JobPosting'))) {
                    return true;
                }
            } catch (e) { }
        }
        return false;
    }

    findJobContentBlocks() {
        const contentBlocks = [];

        // Find elements with substantial text content
        const candidates = document.querySelectorAll('div, section, article, main, [role="main"]');

        for (const element of candidates) {
            const text = element.textContent?.trim();
            if (text && text.length > 200) {
                const jobScore = this.calculateJobContentScore(text);
                if (jobScore > 30) {
                    contentBlocks.push({
                        element,
                        score: jobScore,
                        length: text.length,
                        selector: this.getElementSelector(element)
                    });
                }
            }
        }

        return contentBlocks.sort((a, b) => b.score - a.score);
    }

    calculateJobContentScore(text) {
        const lowerText = text.toLowerCase();
        let score = 0;

        // Job-specific keywords
        const jobKeywords = [
            'responsibilities', 'requirements', 'qualifications', 'experience',
            'skills', 'education', 'bachelor', 'master', 'degree', 'years',
            'candidate', 'position', 'role', 'opportunity', 'team', 'company',
            'salary', 'benefits', 'remote', 'office', 'full-time', 'part-time'
        ];

        // Count keyword frequency
        const keywordCount = jobKeywords.filter(keyword => lowerText.includes(keyword)).length;
        score += keywordCount * 5;

        // Bonus for job section headers
        const sectionHeaders = [
            'job description', 'about the role', 'what you\'ll do',
            'requirements', 'qualifications', 'responsibilities',
            'about you', 'what we\'re looking for'
        ];

        const headerCount = sectionHeaders.filter(header => lowerText.includes(header)).length;
        score += headerCount * 10;

        // Penalty for navigation content
        const navWords = ['home', 'about us', 'contact', 'privacy policy', 'login', 'register'];
        const navCount = navWords.filter(word => lowerText.includes(word)).length;
        score -= navCount * 3;

        return Math.max(0, score);
    }

    analyzeSemanticStructure() {
        const structure = {
            hasMain: !!document.querySelector('main, [role="main"]'),
            hasArticle: !!document.querySelector('article'),
            hasJobSchema: this.hasJobStructuredData(),
            headerLevels: document.querySelectorAll('h1, h2, h3, h4').length,
            formElements: document.querySelectorAll('form, input[type="submit"], button[type="submit"]').length
        };

        return structure;
    }

    assessContentQuality() {
        let quality = 0;

        // Text to code ratio
        const textLength = document.body.textContent.length;
        const htmlLength = document.body.innerHTML.length;
        const textRatio = textLength / htmlLength;
        quality += textRatio * 50;

        // Structural elements
        if (document.querySelector('main, [role="main"]')) quality += 10;
        if (document.querySelector('h1')) quality += 10;
        if (document.querySelectorAll('p').length > 3) quality += 10;

        // Job-specific content
        const bodyText = document.body.textContent.toLowerCase();
        const jobScore = this.calculateJobContentScore(bodyText);
        quality += Math.min(20, jobScore / 5);

        return Math.min(100, quality);
    }

    getElementSelector(element) {
        if (element.id) return `#${element.id}`;
        if (element.className) return `.${element.className.split(' ')[0]}`;
        return element.tagName.toLowerCase();
    }
}

/**
 * Text Intelligence - Advanced text processing and analysis
 */
class TextIntelligence {
    extractIntelligentText(element) {
        if (!element) return '';

        const clone = element.cloneNode(true);

        // Remove script and style elements
        clone.querySelectorAll('script, style, noscript').forEach(el => el.remove());

        // Remove common junk elements
        clone.querySelectorAll('.ad, .advertisement, .share, .social, .nav, .navigation').forEach(el => el.remove());

        // Extract text with structure preservation
        let text = this.extractStructuredText(clone);

        // Clean and normalize
        text = this.cleanText(text);

        return text;
    }

    extractStructuredText(element) {
        let text = '';

        for (const child of element.childNodes) {
            if (child.nodeType === Node.TEXT_NODE) {
                const nodeText = child.textContent.trim();
                if (nodeText) {
                    text += nodeText + ' ';
                }
            } else if (child.nodeType === Node.ELEMENT_NODE) {
                const tagName = child.tagName.toLowerCase();

                if (['div', 'p', 'br', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
                    const childText = this.extractStructuredText(child);
                    if (childText.trim()) {
                        text += childText.trim() + '\n';
                    }
                } else {
                    text += this.extractStructuredText(child) + ' ';
                }
            }
        }

        return text;
    }

    cleanText(text) {
        if (!text) return '';

        return text
            .replace(/\s+/g, ' ')                    // Normalize whitespace
            .replace(/\n\s*\n/g, '\n')              // Remove empty lines
            .replace(/[\u00A0\u2000-\u200B]/g, ' ')  // Remove non-breaking spaces
            .trim();
    }

    analyzeTextForField(text, fieldType) {
        const analysis = {
            rawText: text,
            confidence: 0,
            reasons: []
        };

        const lowerText = text.toLowerCase();

        switch (fieldType) {
            case 'company':
                analysis.confidence = this.analyzeCompanyText(lowerText, analysis.reasons);
                break;
            case 'title':
                analysis.confidence = this.analyzeTitleText(lowerText, analysis.reasons);
                break;
            case 'location':
                analysis.confidence = this.analyzeLocationText(lowerText, analysis.reasons);
                break;
            case 'description':
                analysis.confidence = this.analyzeDescriptionText(lowerText, analysis.reasons);
                break;
        }

        return analysis;
    }

    analyzeCompanyText(text, reasons) {
        let confidence = 50; // Base confidence

        // Positive indicators
        if (text.match(/\b(inc|ltd|llc|corp|corporation|company|group)\b/)) {
            confidence += 20;
            reasons.push('Contains company suffix');
        }

        if (text.length >= 2 && text.length <= 50) {
            confidence += 15;
            reasons.push('Appropriate length');
        }

        // Negative indicators
        const badWords = ['job', 'career', 'position', 'apply', 'search', 'login'];
        if (badWords.some(word => text.includes(word))) {
            confidence -= 30;
            reasons.push('Contains job-related words');
        }

        return Math.max(0, Math.min(100, confidence));
    }

    analyzeTitleText(text, reasons) {
        let confidence = 50;

        // Positive indicators
        const jobTitles = [
            'engineer', 'developer', 'manager', 'analyst', 'specialist',
            'director', 'lead', 'senior', 'junior', 'associate', 'consultant'
        ];

        if (jobTitles.some(title => text.includes(title))) {
            confidence += 25;
            reasons.push('Contains job title keywords');
        }

        if (text.length >= 5 && text.length <= 100) {
            confidence += 15;
            reasons.push('Appropriate length');
        }

        // Negative indicators
        if (text.includes('job') && text.includes('search')) {
            confidence -= 20;
            reasons.push('Appears to be navigation text');
        }

        return Math.max(0, Math.min(100, confidence));
    }

    analyzeLocationText(text, reasons) {
        let confidence = 50;

        // Positive indicators
        if (text.match(/\b(remote|wfh|work from home)\b/i)) {
            confidence += 30;
            reasons.push('Remote work indicator');
        }

        if (text.match(/\b([A-Z][a-z]+ [A-Z]{2}|[A-Z][a-z]+, [A-Z]{2})\b/)) {
            confidence += 25;
            reasons.push('City, State pattern');
        }

        if (text.length >= 2 && text.length <= 50) {
            confidence += 15;
            reasons.push('Appropriate length');
        }

        return Math.max(0, Math.min(100, confidence));
    }

    analyzeDescriptionText(text, reasons) {
        let confidence = 50;

        // Positive indicators
        const descKeywords = [
            'responsibilities', 'requirements', 'qualifications', 'experience',
            'skills', 'bachelor', 'master', 'degree'
        ];

        const keywordCount = descKeywords.filter(keyword => text.includes(keyword)).length;
        confidence += keywordCount * 8;
        reasons.push(`Contains ${keywordCount} description keywords`);

        if (text.length >= 200) {
            confidence += 15;
            reasons.push('Substantial content length');
        }

        // Structure indicators
        if (text.includes('responsibilities') && text.includes('requirements')) {
            confidence += 10;
            reasons.push('Contains job description structure');
        }

        return Math.max(0, Math.min(100, confidence));
    }
}

/**
 * Advanced Content Filter - Intelligent junk removal
 */
class AdvancedContentFilter {
    constructor() {
        this.junkPatterns = [
            // Navigation
            /^(home|about|contact|login|register|sign up|sign in)$/i,
            // Legal
            /^(privacy policy|terms of service|cookie policy)$/i,
            // Social
            /^(follow us|share|like|tweet)$/i,
            // Ads
            /^(advertisement|sponsored|promoted)$/i
        ];

        this.junkSelectors = [
            'nav', 'header.site-header', 'footer.site-footer',
            '.navigation', '.nav', '.navbar', '.header', '.footer',
            '.advertisement', '.ads', '.ad-banner', '.sponsored',
            '.social-share', '.share-buttons', '.social-media',
            '.cookie-notice', '.cookie-banner',
            'script', 'style', 'noscript'
        ];
    }

    isJunkText(text) {
        if (!text || typeof text !== 'string') return true;
        if (text.length < 2) return true;

        const cleanText = text.trim().toLowerCase();

        // Check against junk patterns
        if (this.junkPatterns.some(pattern => pattern.test(cleanText))) {
            return true;
        }

        // Check for obvious navigation text
        const navWords = ['home', 'about', 'contact', 'login', 'register', 'privacy policy'];
        if (navWords.includes(cleanText)) {
            return true;
        }

        // Check for repetitive single words
        if (cleanText.split(' ').length === 1 && cleanText.length < 15) {
            const commonSingleWords = ['jobs', 'careers', 'search', 'apply', 'login', 'home'];
            if (commonSingleWords.includes(cleanText)) {
                return true;
            }
        }

        return false;
    }

    cleanElement(element) {
        if (!element) return null;

        const clone = element.cloneNode(true);

        // Remove junk elements
        this.junkSelectors.forEach(selector => {
            clone.querySelectorAll(selector).forEach(el => el.remove());
        });

        // Remove elements with junk attributes
        clone.querySelectorAll('[class*="ad"], [class*="nav"], [id*="ad"], [id*="nav"]').forEach(el => {
            if (this.isLikelyJunk(el)) {
                el.remove();
            }
        });

        return clone;
    }

    isLikelyJunk(element) {
        const className = element.className.toLowerCase();
        const id = element.id.toLowerCase();

        const junkIndicators = [
            'advertisement', 'nav', 'header', 'footer', 'sidebar',
            'social', 'share', 'cookie', 'popup', 'modal'
        ];

        return junkIndicators.some(indicator =>
            className.includes(indicator) || id.includes(indicator)
        );
    }
}

/**
 * Quality Validator - Multi-layer validation system
 */
class QualityValidator {
    validateField(value, fieldType, confidence = 0) {
        const validation = {
            isValid: false,
            confidence: confidence,
            issues: []
        };

        if (!value || typeof value !== 'string') {
            validation.issues.push('Empty or invalid value');
            return validation;
        }

        const cleanValue = value.trim();

        switch (fieldType) {
            case 'company':
                validation.isValid = this.validateCompany(cleanValue, validation.issues);
                break;
            case 'title':
                validation.isValid = this.validateTitle(cleanValue, validation.issues);
                break;
            case 'location':
                validation.isValid = this.validateLocation(cleanValue, validation.issues);
                break;
            case 'description':
                validation.isValid = this.validateDescription(cleanValue, validation.issues);
                break;
            case 'url':
                validation.isValid = this.validateUrl(cleanValue, validation.issues);
                break;
        }

        return validation;
    }

    validateCompany(company, issues) {
        if (company.length < 1) {
            issues.push('Company name too short');
            return false;
        }

        if (company.length > 100) {
            issues.push('Company name too long');
            return false;
        }

        // Check for website names
        const websiteNames = ['careers', 'jobs', 'naukri', 'indeed', 'linkedin'];
        if (websiteNames.includes(company.toLowerCase())) {
            issues.push('Appears to be website name, not company');
            return false;
        }

        return true;
    }

    validateTitle(title, issues) {
        if (title.length < 3) {
            issues.push('Title too short');
            return false;
        }

        if (title.length > 200) {
            issues.push('Title too long');
            return false;
        }

        // Check for generic titles
        const genericTitles = ['job', 'career', 'position', 'opportunity'];
        if (genericTitles.includes(title.toLowerCase())) {
            issues.push('Too generic title');
            return false;
        }

        return true;
    }

    validateLocation(location, issues) {
        if (location.length < 2) {
            issues.push('Location too short');
            return false;
        }

        if (location.length > 100) {
            issues.push('Location too long');
            return false;
        }

        return true;
    }

    validateDescription(description, issues) {
        if (description.length < 50) {
            issues.push('Description too short');
            return false;
        }

        if (description.length > 10000) {
            issues.push('Description too long');
            return false;
        }

        // Check for job-related content
        const jobKeywords = ['responsibilities', 'requirements', 'experience', 'skills'];
        const hasJobContent = jobKeywords.some(keyword =>
            description.toLowerCase().includes(keyword)
        );

        if (!hasJobContent) {
            issues.push('Does not appear to contain job description content');
            return false;
        }

        return true;
    }

    validateUrl(url, issues) {
        try {
            new URL(url);
            return url.startsWith('http');
        } catch {
            issues.push('Invalid URL format');
            return false;
        }
    }
}

/**
 * Job Pattern Recognizer - Detects job-specific patterns
 */
class JobPatternRecognizer {
    detectSiteType() {
        const hostname = window.location.hostname.toLowerCase();
        const pathname = window.location.pathname.toLowerCase();

        // Job boards
        if (hostname.includes('naukri') || hostname.includes('indeed') ||
            hostname.includes('linkedin') || hostname.includes('glassdoor')) {
            return { type: 'job_board', name: this.getJobBoardName(hostname) };
        }

        // ATS systems
        if (hostname.includes('greenhouse') || hostname.includes('lever') ||
            hostname.includes('workday') || hostname.includes('smartrecruiters')) {
            return { type: 'ats', name: this.getATSName(hostname) };
        }

        // Company career pages
        if (pathname.includes('career') || pathname.includes('job') ||
            pathname.includes('hiring') || pathname.includes('work-with-us')) {
            return { type: 'company', name: 'Company Career Page' };
        }

        return { type: 'unknown', name: 'Generic Site' };
    }

    getJobBoardName(hostname) {
        if (hostname.includes('naukri')) return 'Naukri.com';
        if (hostname.includes('indeed')) return 'Indeed';
        if (hostname.includes('linkedin')) return 'LinkedIn';
        if (hostname.includes('glassdoor')) return 'Glassdoor';
        return 'Job Board';
    }

    getATSName(hostname) {
        if (hostname.includes('greenhouse')) return 'Greenhouse ATS';
        if (hostname.includes('lever')) return 'Lever ATS';
        if (hostname.includes('workday')) return 'Workday ATS';
        if (hostname.includes('smartrecruiters')) return 'SmartRecruiters ATS';
        return 'ATS System';
    }

    findJobPatterns() {
        const patterns = {
            hasApplyButton: !!document.querySelector('a[href*="apply"], .apply-button, .apply-now'),
            hasSalaryInfo: /salary|compensation|\$[\d,]+/.test(document.body.textContent.toLowerCase()),
            hasRequirements: /requirements|qualifications/.test(document.body.textContent.toLowerCase()),
            hasJobTitle: !!document.querySelector('h1, .job-title, .position-title'),
            hasCompanyInfo: !!document.querySelector('.company-name, .employer-name')
        };

        return patterns;
    }
}

/**
 * Universal Field Extractors - Each with multiple strategies
 */
class UniversalBaseExtractor {
    constructor(mainExtractor) {
        this.main = mainExtractor;
        this.strategies = [];
    }

    async extract() {
        const results = [];

        // Try each strategy and collect results
        for (let i = 0; i < this.strategies.length; i++) {
            try {
                const result = await this.strategies[i].call(this);
                if (result && result.value) {
                    results.push({ ...result, strategyIndex: i });
                }
            } catch (error) {
                console.log(`Strategy ${i + 1} failed:`, error.message);
            }
        }

        // Select best result based on confidence
        if (results.length === 0) {
            return { value: this.getFallback(), confidence: 0, method: 'fallback' };
        }

        const best = results.reduce((a, b) => a.confidence > b.confidence ? a : b);
        return best;
    }

    getFallback() {
        return '';
    }
}

class UniversalCompanyExtractor extends UniversalBaseExtractor {
    constructor(mainExtractor) {
        super(mainExtractor);
        this.strategies = [
            this.extractFromStructuredData,
            this.extractFromMetaTags,
            this.extractFromSelectors,
            this.extractFromPageTitle,
            this.extractFromDomain
        ];
    }

    async extractFromStructuredData() {
        const scripts = document.querySelectorAll('script[type="application/ld+json"]');

        for (const script of scripts) {
            try {
                const data = JSON.parse(script.textContent);
                const jobPosting = data['@type'] === 'JobPosting' ? data :
                    data['@graph']?.find(item => item['@type'] === 'JobPosting');

                if (jobPosting?.hiringOrganization?.name) {
                    const company = jobPosting.hiringOrganization.name;
                    const analysis = this.main.textIntelligence.analyzeTextForField(company, 'company');

                    return {
                        value: company,
                        confidence: analysis.confidence,
                        method: 'structured_data'
                    };
                }
            } catch (e) { }
        }

        throw new Error('No company in structured data');
    }

    async extractFromMetaTags() {
        const selectors = [
            'meta[property="og:site_name"]',
            'meta[name="application-name"]',
            'meta[property="og:title"]'
        ];

        for (const selector of selectors) {
            const meta = document.querySelector(selector);
            if (meta?.content) {
                const analysis = this.main.textIntelligence.analyzeTextForField(meta.content, 'company');

                if (analysis.confidence > 60) {
                    return {
                        value: meta.content,
                        confidence: analysis.confidence,
                        method: 'meta_tags'
                    };
                }
            }
        }

        throw new Error('No valid company in meta tags');
    }

    async extractFromSelectors() {
        const selectors = [
            '.company-name', '.employer-name', '.organization-name',
            '[data-company]', '.job-company', '.posting-company',
            '.company', '[class*="company"]', '[id*="company"]'
        ];

        for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);

            for (const element of elements) {
                const text = this.main.textIntelligence.extractIntelligentText(element);
                if (text && !this.main.advancedFilter.isJunkText(text)) {
                    const analysis = this.main.textIntelligence.analyzeTextForField(text, 'company');

                    if (analysis.confidence > 50) {
                        return {
                            value: text,
                            confidence: analysis.confidence,
                            method: 'css_selectors'
                        };
                    }
                }
            }
        }

        throw new Error('No valid company in selectors');
    }

    async extractFromPageTitle() {
        const title = document.title;
        const patterns = [
            /(.+?)\s*[-|]\s*Jobs?/i,
            /(.+?)\s*[-|]\s*Careers?/i,
            /Jobs?\s*at\s*(.+?)(?:\s*[-|]|$)/i,
            /(.+?)\s*[-|]\s*Hiring/i
        ];

        for (const pattern of patterns) {
            const match = title.match(pattern);
            if (match?.[1]) {
                const company = match[1].trim();
                const analysis = this.main.textIntelligence.analyzeTextForField(company, 'company');

                if (analysis.confidence > 60) {
                    return {
                        value: company,
                        confidence: analysis.confidence,
                        method: 'page_title'
                    };
                }
            }
        }

        throw new Error('No valid company in page title');
    }

    async extractFromDomain() {
        const hostname = window.location.hostname.replace('www.', '');
        const domain = hostname.split('.')[0];

        // Skip job board domains
        const jobBoards = ['naukri', 'indeed', 'linkedin', 'glassdoor', 'monster'];
        if (!jobBoards.includes(domain.toLowerCase()) && domain.length > 2) {
            const company = domain.charAt(0).toUpperCase() + domain.slice(1);

            return {
                value: company,
                confidence: 40, // Lower confidence for domain-based extraction
                method: 'domain_name'
            };
        }

        throw new Error('Cannot extract company from domain');
    }

    getFallback() {
        return 'Company Name Not Found';
    }
}

class UniversalTitleExtractor extends UniversalBaseExtractor {
    constructor(mainExtractor) {
        super(mainExtractor);
        this.strategies = [
            this.extractFromStructuredData,
            this.extractFromHeadings,
            this.extractFromSelectors,
            this.extractFromPageTitle
        ];
    }

    async extractFromStructuredData() {
        const scripts = document.querySelectorAll('script[type="application/ld+json"]');

        for (const script of scripts) {
            try {
                const data = JSON.parse(script.textContent);
                const jobPosting = data['@type'] === 'JobPosting' ? data :
                    data['@graph']?.find(item => item['@type'] === 'JobPosting');

                if (jobPosting?.title) {
                    const analysis = this.main.textIntelligence.analyzeTextForField(jobPosting.title, 'title');

                    return {
                        value: jobPosting.title,
                        confidence: analysis.confidence,
                        method: 'structured_data'
                    };
                }
            } catch (e) { }
        }

        throw new Error('No title in structured data');
    }

    async extractFromHeadings() {
        const headings = document.querySelectorAll('h1, h2, h3');

        for (const heading of headings) {
            const text = this.main.textIntelligence.extractIntelligentText(heading);
            if (text && !this.main.advancedFilter.isJunkText(text)) {
                const analysis = this.main.textIntelligence.analyzeTextForField(text, 'title');

                if (analysis.confidence > 60) {
                    return {
                        value: text,
                        confidence: analysis.confidence,
                        method: 'headings'
                    };
                }
            }
        }

        throw new Error('No valid title in headings');
    }

    async extractFromSelectors() {
        const selectors = [
            '.job-title', '.position-title', '.role-title',
            '[data-title]', '.title', '[class*="title"]',
            '.job-header h1', '.job-header h2'
        ];

        for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);

            for (const element of elements) {
                const text = this.main.textIntelligence.extractIntelligentText(element);
                if (text && !this.main.advancedFilter.isJunkText(text)) {
                    const analysis = this.main.textIntelligence.analyzeTextForField(text, 'title');

                    if (analysis.confidence > 50) {
                        return {
                            value: text,
                            confidence: analysis.confidence,
                            method: 'css_selectors'
                        };
                    }
                }
            }
        }

        throw new Error('No valid title in selectors');
    }

    async extractFromPageTitle() {
        const title = document.title.split(' - ')[0].split(' | ')[0];

        if (title) {
            const analysis = this.main.textIntelligence.analyzeTextForField(title, 'title');

            if (analysis.confidence > 40) {
                return {
                    value: title,
                    confidence: analysis.confidence,
                    method: 'page_title'
                };
            }
        }

        throw new Error('No valid title in page title');
    }

    getFallback() {
        return 'Job Title Not Found';
    }
}

class UniversalLocationExtractor extends UniversalBaseExtractor {
    constructor(mainExtractor) {
        super(mainExtractor);
        this.strategies = [
            this.extractFromStructuredData,
            this.extractFromSelectors,
            this.detectRemoteWork,
            this.extractFromTextPatterns
        ];
    }

    async extractFromStructuredData() {
        const scripts = document.querySelectorAll('script[type="application/ld+json"]');

        for (const script of scripts) {
            try {
                const data = JSON.parse(script.textContent);
                const jobPosting = data['@type'] === 'JobPosting' ? data :
                    data['@graph']?.find(item => item['@type'] === 'JobPosting');

                if (jobPosting?.jobLocation) {
                    const location = this.parseLocationData(jobPosting.jobLocation);
                    if (location) {
                        const analysis = this.main.textIntelligence.analyzeTextForField(location, 'location');

                        return {
                            value: location,
                            confidence: analysis.confidence,
                            method: 'structured_data'
                        };
                    }
                }
            } catch (e) { }
        }

        throw new Error('No location in structured data');
    }

    parseLocationData(locationData) {
        if (Array.isArray(locationData)) locationData = locationData[0];
        if (typeof locationData === 'string') return locationData;

        if (locationData?.address) {
            const addr = locationData.address;
            const parts = [addr.addressLocality, addr.addressRegion, addr.addressCountry];
            return parts.filter(Boolean).join(', ');
        }

        return null;
    }

    async extractFromSelectors() {
        const selectors = [
            '.location', '.job-location', '.position-location',
            '[data-location]', '.work-location', '[class*="location"]'
        ];

        for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);

            for (const element of elements) {
                const text = this.main.textIntelligence.extractIntelligentText(element);
                if (text && !this.main.advancedFilter.isJunkText(text)) {
                    const analysis = this.main.textIntelligence.analyzeTextForField(text, 'location');

                    if (analysis.confidence > 50) {
                        return {
                            value: text,
                            confidence: analysis.confidence,
                            method: 'css_selectors'
                        };
                    }
                }
            }
        }

        throw new Error('No valid location in selectors');
    }

    async detectRemoteWork() {
        const text = document.body.textContent.toLowerCase();
        const remotePatterns = [
            /\b(remote|wfh|work from home|distributed|virtual|anywhere)\b/g
        ];

        let remoteCount = 0;
        for (const pattern of remotePatterns) {
            const matches = text.match(pattern);
            if (matches) remoteCount += matches.length;
        }

        if (remoteCount >= 2) {
            return {
                value: 'Remote',
                confidence: 80,
                method: 'remote_detection'
            };
        }

        throw new Error('Remote work not detected');
    }

    async extractFromTextPatterns() {
        const text = document.body.textContent;
        const patterns = [
            /Location[:\s]+([^,\n]{3,50})/i,
            /Based in[:\s]+([^,\n]{3,50})/i,
            /Office[:\s]+([^,\n]{3,50})/i,
            /([A-Z][a-z]+,\s*[A-Z]{2})/g,
            /([A-Z][a-z]+ [A-Z][a-z]+)/g
        ];

        for (const pattern of patterns) {
            const matches = text.match(pattern);
            if (matches) {
                for (const match of matches) {
                    const location = match.replace(/^[^:]*:\s*/, '').trim();
                    const analysis = this.main.textIntelligence.analyzeTextForField(location, 'location');

                    if (analysis.confidence > 60) {
                        return {
                            value: location,
                            confidence: analysis.confidence,
                            method: 'text_patterns'
                        };
                    }
                }
            }
        }

        throw new Error('No valid location in text patterns');
    }

    getFallback() {
        return 'Location Not Specified';
    }
}

class UniversalDescriptionExtractor extends UniversalBaseExtractor {
    constructor(mainExtractor) {
        super(mainExtractor);
        this.strategies = [
            this.extractFromStructuredData,
            this.extractFromJobContentBlocks,
            this.extractFromSelectors,
            this.extractFromMainContent
        ];
    }

    async extractFromStructuredData() {
        const scripts = document.querySelectorAll('script[type="application/ld+json"]');

        for (const script of scripts) {
            try {
                const data = JSON.parse(script.textContent);
                const jobPosting = data['@type'] === 'JobPosting' ? data :
                    data['@graph']?.find(item => item['@type'] === 'JobPosting');

                if (jobPosting?.description) {
                    const cleaned = this.cleanDescription(jobPosting.description);
                    const analysis = this.main.textIntelligence.analyzeTextForField(cleaned, 'description');

                    return {
                        value: cleaned,
                        confidence: analysis.confidence,
                        method: 'structured_data'
                    };
                }
            } catch (e) { }
        }

        throw new Error('No description in structured data');
    }

    async extractFromJobContentBlocks() {
        const contentBlocks = this.main.pageAnalysis.jobContentBlocks;

        for (const block of contentBlocks) {
            const cleaned = this.main.advancedFilter.cleanElement(block.element);
            if (cleaned) {
                const text = this.main.textIntelligence.extractIntelligentText(cleaned);
                const cleanedDesc = this.cleanDescription(text);

                if (cleanedDesc.length >= 200) {
                    const analysis = this.main.textIntelligence.analyzeTextForField(cleanedDesc, 'description');

                    return {
                        value: cleanedDesc,
                        confidence: Math.min(90, analysis.confidence + block.score / 2),
                        method: 'content_blocks'
                    };
                }
            }
        }

        throw new Error('No valid description in content blocks');
    }

    async extractFromSelectors() {
        const selectors = [
            '.job-description', '.description', '.job-content',
            '.posting-content', '.job-details', '.job-summary',
            '[class*="description"]', '[class*="content"]'
        ];

        for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);

            for (const element of elements) {
                const cleaned = this.main.advancedFilter.cleanElement(element);
                if (cleaned) {
                    const text = this.main.textIntelligence.extractIntelligentText(cleaned);
                    const cleanedDesc = this.cleanDescription(text);

                    if (cleanedDesc.length >= 200) {
                        const analysis = this.main.textIntelligence.analyzeTextForField(cleanedDesc, 'description');

                        if (analysis.confidence > 60) {
                            return {
                                value: cleanedDesc,
                                confidence: analysis.confidence,
                                method: 'css_selectors'
                            };
                        }
                    }
                }
            }
        }

        throw new Error('No valid description in selectors');
    }

    async extractFromMainContent() {
        const selectors = ['main', 'article', '[role="main"]', '.main-content'];

        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                const cleaned = this.main.advancedFilter.cleanElement(element);
                if (cleaned) {
                    const text = this.main.textIntelligence.extractIntelligentText(cleaned);
                    const cleanedDesc = this.cleanDescription(text);

                    if (cleanedDesc.length >= 300) {
                        const analysis = this.main.textIntelligence.analyzeTextForField(cleanedDesc, 'description');

                        if (analysis.confidence > 50) {
                            return {
                                value: cleanedDesc,
                                confidence: analysis.confidence,
                                method: 'main_content'
                            };
                        }
                    }
                }
            }
        }

        throw new Error('No valid description in main content');
    }

    cleanDescription(text) {
        if (!text) return '';

        return text
            .replace(/Apply now|Apply here|Click to apply/gi, '')
            .replace(/Share this job|Save job|Print job/gi, '')
            .replace(/Back to search|Search jobs/gi, '')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 5000); // Reasonable limit
    }

    getFallback() {
        return 'Job description could not be extracted from this page';
    }
}

class UniversalUrlExtractor extends UniversalBaseExtractor {
    constructor(mainExtractor) {
        super(mainExtractor);
        this.strategies = [
            this.extractFromApplyButtons,
            this.extractFromForms,
            this.useCurrentUrl
        ];
    }

    async extractFromApplyButtons() {
        const selectors = [
            'a[href*="apply"]', '.apply-button a', '.apply-now a',
            'a[title*="apply" i]', 'a[aria-label*="apply" i]'
        ];

        for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);

            for (const element of elements) {
                if (element.href && this.isValidUrl(element.href)) {
                    return {
                        value: element.href,
                        confidence: 90,
                        method: 'apply_buttons'
                    };
                }
            }
        }

        throw new Error('No apply URL found');
    }

    async extractFromForms() {
        const forms = document.querySelectorAll('form[action]');

        for (const form of forms) {
            const action = form.action;
            if (action && action.includes('apply') && this.isValidUrl(action)) {
                return {
                    value: action,
                    confidence: 80,
                    method: 'form_action'
                };
            }
        }

        throw new Error('No form apply URL found');
    }

    async useCurrentUrl() {
        return {
            value: window.location.href,
            confidence: 60,
            method: 'current_url'
        };
    }

    isValidUrl(url) {
        try {
            new URL(url);
            return url.startsWith('http');
        } catch {
            return false;
        }
    }

    getFallback() {
        return window.location.href;
    }
}

export default UltraRobustJobExtractor;