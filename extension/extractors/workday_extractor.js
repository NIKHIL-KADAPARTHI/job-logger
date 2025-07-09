// workday_extractor.js - Complete Enhanced Production Workday ATS Extractor with Smart Selection
console.log('🏢 Workday Enhanced Production Extractor Module Loaded');

class WorkdayExtractor {
    constructor() {
        this.currentSite = this.detectSite();
    }

    detectSite() {
        const hostname = window.location.hostname.toLowerCase();
        return hostname.includes('myworkdayjobs.com') || hostname.includes('workday.com') ? 'workday' : 'generic';
    }

    async extractJobData() {
        console.log('🏢 Starting Workday enhanced extraction...');
        const startTime = performance.now();

        const jobData = this.currentSite === 'workday' ? await this.extractFromWorkday() : await this.extractGeneric();

        jobData.extractionTime = Math.round(performance.now() - startTime);
        jobData.qualityScore = this.calculateQualityScore(jobData);
        jobData.qualityGrade = this.getQualityGrade(jobData.qualityScore);

        console.log('✅ Workday extraction completed:', {
            site: jobData.siteDetected,
            time: jobData.extractionTime + 'ms',
            quality: jobData.qualityGrade,
            score: jobData.qualityScore,
            descriptionLength: jobData.description?.length || 0
        });

        return jobData;
    }

    async extractFromWorkday() {
        return {
            company: this.extractWorkdayCompany(),
            title: this.extractWorkdayTitle(),
            location: this.extractWorkdayLocation(),
            description: this.extractWorkdayDescription(),
            applicationUrl: this.extractApplicationUrl(),
            url: window.location.href,
            extractedAt: new Date().toISOString(),
            siteDetected: 'Workday ATS',
            extractionMethod: 'workday_enhanced'
        };
    }

    extractWorkdayCompany() {
        const strategies = [
            this.extractCompanyFromURL,           // Most reliable for Workday
            this.extractCompanyFromJSONLD,        // Clean JSON-LD data
            this.extractCompanyFromTitle,         // Page title fallback
            this.extractCompanyFromSelectors      // DOM selectors
        ];

        for (const strategy of strategies) {
            try {
                const result = strategy.call(this);
                if (result && this.isValidCompany(result)) return this.cleanText(result);
            } catch (_) { }
        }
        return 'Company Name Not Found';
    }

    extractCompanyFromURL() {
        // Extract from Workday URL: company.wd1.myworkdayjobs.com
        const hostname = window.location.hostname;
        const urlMatch = hostname.match(/^([^.]+)\.wd\d+\.myworkdayjobs\.com/);

        if (urlMatch?.[1]) {
            return this.formatCompanyName(urlMatch[1]);
        }

        throw new Error('Company not found in URL');
    }

    extractCompanyFromJSONLD() {
        return this.extractFromJSONLD(item => {
            // Clean up messy JSON-LD company names
            const companyName = item.hiringOrganization?.name;
            if (!companyName) return null;

            // Remove internal codes and clean up
            let cleaned = companyName
                .replace(/^\d+\s+/, '')                    // Remove leading numbers "2100 NVIDIA"
                .replace(/\s*\([^)]*\)$/, '')              // Remove trailing parentheses "(IN50)"
                .replace(/\s*(LTD|LLC|INC|CORP)\.?$/i, '') // Remove legal suffixes
                .replace(/\s*USA$/, '')                    // Remove "USA" suffix
                .replace(/^\w+\s*-\s*/, '')                // Remove prefix codes "IN50 - "
                .trim();

            return cleaned;
        });
    }

    extractCompanyFromTitle() {
        const title = document.title;
        const patterns = [
            /(.+?)\s*[-|]\s*Job\s*Details/i,
            /(.+?)\s*[-|]\s*Career/i,
            /Jobs\s*at\s*(.+?)(?:\s*[-|]|$)/i,
            /(.+?)\s*[-|]\s*Workday/i
        ];

        for (const pattern of patterns) {
            const match = title.match(pattern);
            if (match?.[1]) {
                const company = match[1].trim();
                if (this.isValidCompany(company)) return company;
            }
        }
        throw new Error('Company not found in title');
    }

    extractCompanyFromSelectors() {
        const selectors = [
            '[data-automation-id="company"]',
            '.company-name',
            '[data-automation-id="primaryLocationText"]',
            '[data-automation-id="jobPostingCompany"]',
            '.company-info',
            '[class*="company"]'
        ];
        return this.extractFromElements(selectors, this.isValidCompany);
    }

    extractWorkdayTitle() {
        const strategies = [
            this.extractTitleFromJSONLD,
            this.extractTitleFromURL,              // NEW: Extract from URL
            this.extractTitleFromSelectors,
            this.extractTitleFromHeadings
        ];

        for (const strategy of strategies) {
            try {
                const result = strategy.call(this);
                if (result?.length > 3 && !this.isGenericTitle(result)) {
                    return this.cleanText(result);
                }
            } catch (_) { }
        }
        return 'Job Title Not Found';
    }

    extractTitleFromURL() {
        // Extract job title from Workday URL
        const url = window.location.href;

        // Pattern: /job/Location/Job-Title_REQID
        const titleMatch = url.match(/\/job\/[^\/]+\/([^_\/]+)_/);
        if (titleMatch?.[1]) {
            // Convert URL format to readable title
            const title = titleMatch[1]
                .replace(/-/g, ' ')                    // Convert hyphens to spaces
                .replace(/\b\w/g, l => l.toUpperCase()) // Capitalize words
                .trim();

            if (title.length > 3 && !this.isGenericTitle(title)) {
                return title;
            }
        }

        throw new Error('Title not found in URL');
    }

    extractTitleFromJSONLD() {
        return this.extractFromJSONLD(item => item.title);
    }

    extractTitleFromSelectors() {
        const selectors = [
            '[data-automation-id="jobPostingHeader"]',
            '[data-automation-id="jobTitle"]',
            'h1[data-automation-id]',
            '[data-automation-id="jobPostingTitle"]',
            '.job-title',
            'h1',
            'h2'
        ];

        return this.extractFromElements(selectors, text =>
            text.length > 3 && text.length < 200 && !this.isGenericTitle(text)
        );
    }

    extractTitleFromHeadings() {
        const headings = document.querySelectorAll('h1, h2, h3');
        for (const heading of headings) {
            const text = heading.textContent?.trim();
            if (text && text.length > 3 && text.length < 200 &&
                !this.isGenericTitle(text)) {
                return text;
            }
        }
        throw new Error('Title not found in headings');
    }

    extractWorkdayLocation() {
        const strategies = [
            this.extractLocationFromJSONLD,
            this.extractLocationFromURL,           // NEW: Extract from URL
            this.extractLocationFromSelectors,
            this.detectRemoteWork
        ];

        for (const strategy of strategies) {
            try {
                const result = strategy.call(this);
                if (result) return this.cleanLocationText(result);
            } catch (_) { }
        }
        return 'Location Not Specified';
    }

    extractLocationFromURL() {
        // Extract location from Workday URL
        const url = window.location.href;

        // Pattern: /job/Location/Job-Title_REQID
        const locationMatch = url.match(/\/job\/([^\/]+)\//);
        if (locationMatch?.[1]) {
            const location = locationMatch[1]
                .replace(/-/g, ' ')                    // Convert hyphens to spaces
                .replace(/\b\w/g, l => l.toUpperCase()) // Capitalize words
                .trim();

            if (location && location.length > 2) {
                return location;
            }
        }

        throw new Error('Location not found in URL');
    }

    extractLocationFromJSONLD() {
        return this.extractFromJSONLD(item => this.parseLocationData(item.jobLocation));
    }

    extractLocationFromSelectors() {
        const selectors = [
            '[data-automation-id="jobPostingLocation"]',
            '[data-automation-id="primaryLocationText"]',
            '[data-automation-id="locations"]',
            '[data-automation-id="jobLocation"]',
            '.job-location',
            '[class*="location"]'
        ];
        return this.extractFromElements(selectors, this.isValidLocation);
    }

    detectRemoteWork() {
        const text = document.body.textContent.toLowerCase();
        const url = window.location.href.toLowerCase();

        const remoteIndicators = [
            'remote', 'work from home', 'wfh', 'distributed',
            'virtual', 'anywhere', 'telecommute'
        ];

        // Check URL for remote indicators
        const urlRemoteCount = remoteIndicators.filter(indicator =>
            url.includes(indicator)
        ).length;

        // Check page content for remote indicators
        const contentRemoteCount = remoteIndicators.filter(indicator =>
            text.includes(indicator)
        ).length;

        if (urlRemoteCount >= 1 || contentRemoteCount >= 2) {
            return 'Remote';
        }

        throw new Error('Remote work not detected');
    }

    // ===== SMART DESCRIPTION EXTRACTION - QUALITY OVER QUANTITY =====
    extractWorkdayDescription() {
        console.log('🔍 Starting complete description extraction with smart selection...');

        const extractionResults = [];

        const strategies = [
            this.extractDescriptionFromJSONLD,
            this.extractDescriptionFromWorkdaySelectors,
            this.extractDescriptionFromContentAreas,
            this.extractDescriptionFromIframes,
            this.extractDescriptionFromGenericSelectors,
            this.extractDescriptionFromMainContent,
            this.extractDescriptionFallback
        ];

        // Try all methods and collect results
        for (const strategy of strategies) {
            try {
                const result = strategy.call(this);
                if (result && result.length >= 200) {
                    extractionResults.push({
                        method: strategy.name,
                        content: result,
                        length: result.length,
                        isComplete: this.isDescriptionComplete(result)
                    });
                    console.log(`✅ ${strategy.name}: ${result.length} chars, Complete: ${this.isDescriptionComplete(result)}`);
                }
            } catch (error) {
                console.log(`⚠️ ${strategy.name} failed:`, error.message);
            }
        }

        if (extractionResults.length === 0) {
            console.log('❌ No valid descriptions found');
            return 'Job description could not be extracted from this page';
        }

        // Select the best description based on QUALITY, not just length
        const bestDescription = this.selectBestDescription(extractionResults);
        console.log(`🏆 Selected best description: ${bestDescription.method} (${bestDescription.length} chars, Quality Score: ${bestDescription.qualityScore})`);

        return this.cleanDescriptionTextComplete(bestDescription.content);
    }

    // FIXED: Select the best description from multiple extraction results - QUALITY OVER QUANTITY
    selectBestDescription(results) {
        console.log('🎯 Analyzing extraction results for best quality...');

        // Score each result based on quality, not just length
        const scoredResults = results.map(result => {
            const score = this.calculateDescriptionQuality(result);
            console.log(`📊 ${result.method}: ${result.length} chars, Quality Score: ${score}`);
            return { ...result, qualityScore: score };
        });

        // Sort by quality score (highest first)
        scoredResults.sort((a, b) => b.qualityScore - a.qualityScore);

        const bestResult = scoredResults[0];
        console.log(`🏆 Best quality: ${bestResult.method} (Score: ${bestResult.qualityScore})`);

        return bestResult;
    }

    // NEW: Calculate description quality score (higher = better)
    calculateDescriptionQuality(result) {
        const text = result.content.toLowerCase();
        let score = 0;

        // Base score from length (but capped to prevent runaway)
        score += Math.min(result.length / 10, 500); // Max 500 points for length

        // MAJOR BONUS: Prefer specific extraction methods
        const methodBonus = {
            'extractDescriptionFromJSONLD': 2000,           // Highest priority - clean structured data
            'extractDescriptionFromWorkdaySelectors': 1500, // Second priority - Workday specific
            'extractDescriptionFromGenericSelectors': 1000, // Third priority - generic job selectors
            'extractDescriptionFromContentAreas': 800,      // Fourth priority - content areas
            'extractDescriptionFromMainContent': 600,       // Fifth priority - main content analysis
            'extractDescriptionFromIframes': 400,           // Sixth priority - iframe content
            'extractDescriptionFromFallback': 200           // LOWEST priority - fallback method
        };

        score += methodBonus[result.method] || 0;

        // BONUS: Job-related content indicators
        const jobKeywords = [
            'responsibilities', 'requirements', 'qualifications', 'experience',
            'skills', 'education', 'bachelor', 'master', 'degree', 'years',
            'required', 'preferred', 'candidate', 'position', 'role'
        ];

        const jobKeywordCount = jobKeywords.filter(keyword => text.includes(keyword)).length;
        score += jobKeywordCount * 100; // 100 points per job keyword

        // HUGE PENALTY: Page navigation and footer content
        const navigationIndicators = [
            'skip to main content', 'main navigation', 'career', 'sign in',
            'privacy policy', 'cookie', 'workday, inc', 'all rights reserved',
            'follow us', 'social media', 'back to search', 'print job',
            'save job', 'share this job', 'english', 'language selector'
        ];

        const navCount = navigationIndicators.filter(indicator => text.includes(indicator)).length;
        score -= navCount * 300; // HEAVY penalty for navigation content

        // PENALTY: Content that starts with navigation
        if (text.startsWith('skip to main content') ||
            text.includes('careersenglish') ||
            text.includes('sign incareers')) {
            score -= 1000; // Major penalty for page header content
        }

        // PENALTY: Content that ends with footer
        if (text.includes('© 2025 workday') ||
            text.includes('all rights reserved') ||
            text.includes('workday, inc. all rights reserved')) {
            score -= 800; // Major penalty for footer content
        }

        // BONUS: Proper job description structure
        if (text.includes('responsibilities') && text.includes('requirements')) {
            score += 500; // Bonus for having both key sections
        }

        // BONUS: Completeness (but only if quality is good)
        if (result.isComplete && navCount < 2) {
            score += 300; // Bonus for complete descriptions (if not full of navigation)
        }

        // PENALTY: Too much repetitive content (indicates page template)
        const uniqueWords = new Set(text.split(/\s+/));
        const repetitiveness = text.length / uniqueWords.size;
        if (repetitiveness > 8) {
            score -= 200; // Penalty for repetitive content
        }

        return Math.max(score, 0); // Don't go below 0
    }

    // FIXED: Enhanced JSON-LD extraction - return clean content only
    extractDescriptionFromJSONLD() {
        console.log('📋 Trying enhanced JSON-LD extraction...');

        const scripts = document.querySelectorAll('script[type="application/ld+json"]');
        let bestDescription = '';

        for (const script of scripts) {
            try {
                const data = JSON.parse(script.textContent);
                const graph = data['@graph'] || [data];

                for (const item of graph) {
                    if (item['@type'] === 'JobPosting') {
                        // Try multiple description fields
                        const descriptionFields = [
                            item.description,
                            item.jobDescription,
                            item.content,
                            item.text,
                            item.body
                        ];

                        for (const desc of descriptionFields) {
                            if (desc && typeof desc === 'string' && desc.length > bestDescription.length) {
                                // Clean the JSON-LD description
                                const cleanDesc = this.cleanJobDescriptionOnly(desc);
                                if (cleanDesc.length > bestDescription.length) {
                                    bestDescription = cleanDesc;
                                }
                            }
                        }
                    }
                }
            } catch (_) { }
        }

        if (bestDescription && bestDescription.length >= 200) {
            console.log(`📋 JSON-LD found clean description: ${bestDescription.length} characters`);
            return bestDescription;
        }

        throw new Error('No valid description in JSON-LD');
    }

    // FIXED: Enhanced Workday selector extraction - return clean content only
    extractDescriptionFromWorkdaySelectors() {
        console.log('🏢 Trying enhanced Workday-specific selectors...');

        // Focus on the most reliable Workday selectors first
        const primarySelectors = [
            '[data-automation-id="jobPostingDescription"]',
            '[data-automation-id="jobDescription"]',
            '[data-automation-id="jobDetails"]'
        ];

        // Try primary selectors first
        for (const selector of primarySelectors) {
            const elements = document.querySelectorAll(selector);
            for (const element of elements) {
                const text = this.extractTextFromElementComplete(element);
                const cleanText = this.cleanJobDescriptionOnly(text);
                if (cleanText && cleanText.length >= 200 && this.isValidJobDescription(cleanText)) {
                    console.log(`🏢 Found clean description with ${selector}: ${cleanText.length} chars`);
                    return cleanText;
                }
            }
        }

        // If primary selectors fail, try secondary selectors
        const secondarySelectors = [
            '[data-automation-id="richText"]',
            '[data-automation-id="htmlText"]',
            '[data-automation-id="content"]',
            '[data-automation-id="tabPanel"]',
            '[role="tabpanel"]'
        ];

        for (const selector of secondarySelectors) {
            const elements = document.querySelectorAll(selector);
            for (const element of elements) {
                const text = this.extractTextFromElementComplete(element);
                const cleanText = this.cleanJobDescriptionOnly(text);
                if (cleanText && cleanText.length >= 200 && this.isValidJobDescription(cleanText)) {
                    console.log(`🏢 Found clean description with ${selector}: ${cleanText.length} chars`);
                    return cleanText;
                }
            }
        }

        throw new Error('No clean description found in Workday selectors');
    }

    extractDescriptionFromContentAreas() {
        console.log('📄 Trying enhanced content areas...');

        const containerSelectors = [
            // Main content areas
            'main', '[role="main"]', '.main-content', '.content-main',
            // Article containers  
            'article', '[role="article"]',
            // Content wrappers
            '.content', '.job-content', '.posting-content', '.description-content',
            // Page containers
            '.page-content', '.job-page', '.posting-page',
            // Workday specific
            '[class*="workday"]', '[id*="workday"]',
            // Generic content containers
            '.container', '.wrapper', '.content-wrapper'
        ];

        let bestText = '';

        for (const selector of containerSelectors) {
            const container = document.querySelector(selector);
            if (container) {
                const text = this.extractTextFromElementComplete(container);
                const cleanText = this.cleanJobDescriptionOnly(text);
                if (cleanText && cleanText.length > 500 && this.isValidJobDescription(cleanText)) {
                    if (cleanText.length > bestText.length) {
                        bestText = cleanText;
                        console.log(`📄 Found better content in ${selector}: ${cleanText.length} chars`);
                    }
                }
            }
        }

        if (bestText) {
            return bestText;
        }

        throw new Error('No description found in content areas');
    }

    extractDescriptionFromIframes() {
        console.log('🖼️ Checking iframes for job content...');

        const iframes = document.querySelectorAll('iframe');
        for (const iframe of iframes) {
            try {
                // Check if iframe might contain job content
                const src = iframe.src || '';
                const title = iframe.title || '';

                if (src.includes('job') || title.toLowerCase().includes('job') ||
                    title.toLowerCase().includes('description')) {

                    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                    if (iframeDoc && iframeDoc.body) {
                        const text = this.extractTextFromElementComplete(iframeDoc.body);
                        const cleanText = this.cleanJobDescriptionOnly(text);
                        if (cleanText && cleanText.length >= 200 && this.isValidJobDescription(cleanText)) {
                            console.log('✅ Found description in iframe');
                            return cleanText;
                        }
                    }
                }
            } catch (e) {
                // Cross-origin iframe - skip silently
                continue;
            }
        }

        throw new Error('Description not found in iframes');
    }

    extractDescriptionFromGenericSelectors() {
        const selectors = [
            '.job-description',
            '[class*="description"]',
            '.job-content',
            '.posting-content',
            '.job-details'
        ];

        for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);
            for (const el of elements) {
                const text = this.extractTextFromElementComplete(el);
                const cleanText = this.cleanJobDescriptionOnly(text);
                if (cleanText && cleanText.length >= 200 && this.isValidJobDescription(cleanText)) {
                    return cleanText;
                }
            }
        }

        throw new Error('Valid element not found');
    }

    // Enhanced main content extraction that finds the largest relevant text block
    extractDescriptionFromMainContent() {
        console.log('📋 Trying enhanced main content extraction...');

        const textBlocks = [];

        // Look for substantial text blocks in various elements
        const elements = document.querySelectorAll('div, section, article, p, main, [role="main"]');

        for (const element of elements) {
            // Skip if element is too nested (likely to be duplicated content)
            const depth = this.getElementDepth(element);
            if (depth > 10) continue;

            const text = this.extractTextFromElementComplete(element);
            if (text && text.length >= 200) {
                // Calculate content uniqueness
                const childTexts = Array.from(element.children)
                    .map(child => this.extractTextFromElementComplete(child))
                    .filter(t => t.length > 50);

                const combinedChildText = childTexts.join(' ');
                const uniqueText = text.replace(combinedChildText, '').trim();

                if (uniqueText.length >= 200) {
                    textBlocks.push({
                        element,
                        text: uniqueText,
                        fullText: text,
                        length: text.length,
                        uniqueLength: uniqueText.length,
                        depth: depth,
                        selector: this.getElementSelector(element)
                    });
                }
            }
        }

        // Sort by relevance: prefer job-related content and reasonable depth
        textBlocks.sort((a, b) => {
            const aScore = this.calculateContentScore(a);
            const bScore = this.calculateContentScore(b);
            return bScore - aScore;
        });

        for (const block of textBlocks) {
            const cleanText = this.cleanJobDescriptionOnly(block.fullText);
            if (this.isValidJobDescription(cleanText)) {
                console.log(`📋 Found main content: ${block.selector} (${cleanText.length} chars, depth: ${block.depth})`);
                return cleanText;
            }
        }

        throw new Error('No valid description found in main content');
    }

    // IMPROVED: Fallback method with better filtering
    extractDescriptionFallback() {
        console.log('🔄 Using improved fallback extraction...');

        // Get text from body but filter out navigation areas first
        const body = document.body.cloneNode(true);

        // Remove navigation and footer elements
        const unwantedSelectors = [
            'nav', 'header', 'footer', '[role="navigation"]',
            '[role="banner"]', '[role="contentinfo"]',
            '.navigation', '.nav', '.header', '.footer',
            '[class*="nav"]', '[class*="header"]', '[class*="footer"]'
        ];

        unwantedSelectors.forEach(selector => {
            body.querySelectorAll(selector).forEach(el => el.remove());
        });

        const bodyText = body.textContent || '';
        const paragraphs = bodyText.split(/\n\s*\n/).filter(p => p.trim().length > 100);

        // Look for paragraphs with high job content density
        const jobKeywords = [
            'responsibilities', 'requirements', 'qualifications', 'experience',
            'skills', 'education', 'preferred', 'required', 'must have',
            'bachelor', 'master', 'degree', 'years of experience', 'role',
            'position', 'opportunity', 'team', 'company', 'work', 'job'
        ];

        let bestMatch = '';
        let bestScore = 0;

        for (const paragraph of paragraphs) {
            const lowerText = paragraph.toLowerCase();

            // Skip if contains too much navigation
            const navIndicators = ['skip to', 'sign in', 'privacy policy', 'workday, inc'];
            const navCount = navIndicators.filter(nav => lowerText.includes(nav)).length;
            if (navCount > 1) continue;

            const keywordCount = jobKeywords.filter(keyword =>
                lowerText.includes(keyword)
            ).length;

            const score = keywordCount * (paragraph.length / 100);

            if (score > bestScore && paragraph.length >= 300) {
                bestScore = score;
                bestMatch = paragraph;
            }
        }

        if (bestMatch && bestScore > 3) {
            const cleanMatch = this.cleanJobDescriptionOnly(bestMatch);
            if (cleanMatch.length >= 200) {
                console.log('✅ Found clean description using improved fallback method');
                return cleanMatch;
            }
        }

        throw new Error('Improved fallback extraction failed');
    }

    // Check if description appears complete (not truncated)
    isDescriptionComplete(text) {
        if (!text || text.length < 200) return false;

        const lastSentence = text.trim().slice(-100);

        // Check for truncation indicators
        const truncationIndicators = [
            /\.\.\.$/, // ends with ...
            /…$/, // ends with ellipsis
            /\w{10,}$/, // ends with very long word (likely cut off)
            /-$/, // ends with hyphen
            /\band\s*$/, // ends with incomplete "and"
            /\bor\s*$/, // ends with incomplete "or"
            /\bthe\s*$/, // ends with incomplete "the"
            /\s[a-z]+$/, // ends with lowercase word (mid-sentence)
        ];

        const hasCompletionIndicators = [
            /\.$/, // ends with period
            /!$/, // ends with exclamation
            /\?$/, // ends with question mark
            /apply/i, // contains "apply"
            /contact/i, // contains "contact"
            /opportunity/i, // contains "opportunity"
            /equal opportunity employer/i, // standard ending
            /learn more/i, // standard ending
        ];

        const isTruncated = truncationIndicators.some(pattern => pattern.test(lastSentence));
        const isComplete = hasCompletionIndicators.some(pattern => pattern.test(lastSentence));

        return !isTruncated && (isComplete || text.length > 2000);
    }

    // Enhanced element text extraction that preserves more content
    extractTextFromElementComplete(element) {
        if (!element) return '';

        // Clone element to avoid modifying original
        const clone = element.cloneNode(true);

        // Remove unwanted elements but preserve content structure
        const unwantedSelectors = [
            'script', 'style', 'noscript',
            '.sr-only', '[aria-hidden="true"]',
            '.visually-hidden', '.screen-reader-only'
        ];

        unwantedSelectors.forEach(selector => {
            clone.querySelectorAll(selector).forEach(el => el.remove());
        });

        // Extract text with better formatting preservation
        let text = '';

        // Try different text extraction methods
        if (clone.innerText) {
            text = clone.innerText; // Preserves line breaks and formatting
        } else if (clone.textContent) {
            text = clone.textContent;
        } else {
            text = clone.innerHTML?.replace(/<[^>]*>/g, ' ') || '';
        }

        // Clean up text while preserving structure
        text = text
            .replace(/\t/g, ' ')                    // Convert tabs to spaces
            .replace(/ {3,}/g, '  ')               // Reduce multiple spaces to double
            .replace(/\n{3,}/g, '\n\n')            // Reduce multiple line breaks
            .trim();

        return text;
    }

    // Calculate content relevance score
    calculateContentScore(block) {
        let score = block.length;

        // Prefer moderate depth (not too shallow, not too deep)
        if (block.depth >= 3 && block.depth <= 8) score += 1000;

        // Bonus for job-related keywords
        const jobKeywords = ['responsibilities', 'requirements', 'qualifications', 'experience', 'skills'];
        const keywordCount = jobKeywords.filter(keyword =>
            block.text.toLowerCase().includes(keyword)
        ).length;
        score += keywordCount * 500;

        // Bonus for completeness indicators
        if (this.isDescriptionComplete(block.fullText)) score += 2000;

        return score;
    }

    // Get element depth in DOM tree
    getElementDepth(element) {
        let depth = 0;
        let current = element;
        while (current.parentElement) {
            depth++;
            current = current.parentElement;
        }
        return depth;
    }

    // NEW: Clean job description only - removes page navigation
    cleanJobDescriptionOnly(text) {
        if (!text) return '';

        let cleaned = text;

        // Remove common page navigation and header content
        cleaned = cleaned
            // Remove navigation headers
            .replace(/^.*?Skip to main content.*?/i, '')
            .replace(/^.*?CareersEnglish.*?/i, '')
            .replace(/^.*?Sign In.*?Careers.*?/i, '')
            .replace(/^.*?main navigation.*?/i, '')

            // Remove footer content
            .replace(/©\s*\d{4}.*?Workday.*?All rights reserved\.?.*$/i, '')
            .replace(/Follow Us.*$/i, '')
            .replace(/Privacy Policy.*$/i, '')
            .replace(/Cookie.*?Policy.*$/i, '')

            // Remove common Workday page elements
            .replace(/Skip to main content/gi, '')
            .replace(/Back to search results/gi, '')
            .replace(/Print job/gi, '')
            .replace(/Save job/gi, '')
            .replace(/Share this job/gi, '')
            .replace(/Apply for this position/gi, '')

            // Clean up whitespace
            .replace(/\s+/g, ' ')
            .replace(/\n\s*\n\s*\n+/g, '\n\n')
            .trim();

        return cleaned;
    }

    // NEW: Enhanced validation for actual job descriptions
    isValidJobDescription(text) {
        if (!text || text.length < 200) return false;

        const lowerText = text.toLowerCase();

        // Must have job-related content
        const jobIndicators = [
            'responsibilities', 'requirements', 'qualifications', 'skills',
            'experience', 'role', 'position', 'candidate', 'education',
            'bachelor', 'master', 'degree', 'years', 'required', 'preferred'
        ];

        const jobIndicatorCount = jobIndicators.filter(indicator =>
            lowerText.includes(indicator)
        ).length;

        // Must have at least 2 job indicators
        if (jobIndicatorCount < 2) return false;

        // Reject if too much navigation content
        const navigationContent = [
            'skip to main content', 'sign in', 'careers', 'privacy policy',
            'cookie policy', 'workday, inc', 'all rights reserved',
            'follow us', 'back to search'
        ];

        const navCount = navigationContent.filter(nav => lowerText.includes(nav)).length;

        // Reject if more than 2 navigation elements
        if (navCount > 2) return false;

        // Reject if it starts with navigation
        if (lowerText.startsWith('skip to') ||
            lowerText.startsWith('careersenglish') ||
            lowerText.includes('main navigation')) {
            return false;
        }

        return true;
    }

    // Enhanced text cleaning that preserves complete content
    cleanDescriptionTextComplete(text) {
        if (!text) return '';

        return text
            // Remove HTML tags if any leaked through
            .replace(/<[^>]*>/g, '')

            // Normalize whitespace but preserve paragraph structure
            .replace(/[ \t]+/g, ' ')                    // Multiple spaces/tabs to single space
            .replace(/\n\s*\n\s*\n+/g, '\n\n')          // Multiple line breaks to double

            // Remove common prefixes but be conservative
            .replace(/^(Job Details?|Job Description|Description)[\s:]+/i, '')

            // Remove obvious footer content but preserve main content
            .replace(/\n\s*(Apply Now|Submit [Aa]pplication)[\s\S]*$/i, '')
            .replace(/\n\s*(Share this job|Print job|Save job)[\s\S]*$/i, '')

            // Clean up
            .trim();
        // REMOVED THE SUBSTRING LIMIT - No more truncation!
    }

    // Helper method to get a readable selector for an element
    getElementSelector(element) {
        if (element.id) return `#${element.id}`;
        if (element.className) return `.${element.className.split(' ')[0]}`;
        return element.tagName.toLowerCase();
    }
    // ===== END SMART DESCRIPTION EXTRACTION =====

    extractApplicationUrl() {
        // Look for Workday apply buttons/links
        const selectors = [
            '[data-automation-id="applyButton"]',
            '[data-automation-id="apply"]',
            'a[href*="apply"]',
            '.apply-button',
            'button[type="submit"]',
            '[title*="apply" i]',
            '[aria-label*="apply" i]'
        ];

        for (const selector of selectors) {
            const el = document.querySelector(selector);
            if (el?.href && this.isValidUrl(el.href)) return el.href;
        }

        return window.location.href;
    }

    // ===== UTILITY METHODS =====
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

    formatCompanyName(slug) {
        if (!slug) return '';

        // Handle special cases for known company slugs
        const specialCases = {
            'nvidia': 'NVIDIA',
            'hitachi': 'Hitachi',
            'philips': 'Philips',
            'csgi': 'CSG International',
            'mcdonalds': 'McDonald\'s',
            'pepsico': 'PepsiCo',
            'ge': 'General Electric',
            'ibm': 'IBM',
            'jpmorgan': 'JPMorgan Chase',
            'wellsfargo': 'Wells Fargo',
            'bankofamerica': 'Bank of America',
            'att': 'AT&T',
            'fedex': 'FedEx'
        };

        const lowerSlug = slug.toLowerCase();
        if (specialCases[lowerSlug]) return specialCases[lowerSlug];

        // Standard formatting: split on hyphens/underscores and capitalize
        return slug.split(/[-_]/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    isGenericTitle(title) {
        const genericTitles = [
            'careers', 'career', 'jobs', 'job', 'opportunities',
            'positions', 'openings', 'hiring', 'join us', 'work with us'
        ];
        return genericTitles.includes(title.toLowerCase().trim());
    }

    cleanLocationText(text) {
        return text
            .replace(/^\(\w+\)/, '')                    // Remove prefix codes "(HE)"
            .replace(/_/g, ' ')                         // Replace underscores
            .replace(/\s*-\s*/g, ', ')                  // Replace hyphens with commas
            .replace(/\s+/g, ' ')                       // Normalize spaces
            .trim();
    }

    cleanText(text) {
        return text?.trim().replace(/\s+/g, ' ').replace(/[\r\n\t\u00A0]+/g, ' ').trim();
    }

    isValidLocation(text) {
        const invalidPatterns = [
            /^fa-/i, /^icon/i, /^button/i, /workday/i,
            /automation/i, /filter/i, /search/i
        ];
        return text && text.length > 1 && text.length < 100 &&
            !invalidPatterns.some(p => p.test(text));
    }

    isValidCompany(company) {
        const cleaned = company.trim().toLowerCase();
        return cleaned.length >= 2 && cleaned.length <= 100 &&
            !cleaned.includes('workday') &&
            !cleaned.includes('career') &&
            !cleaned.includes('search') &&
            !cleaned.includes('automation');
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
        if (title && title !== 'Job Title Not Found' && !this.isGenericTitle(title)) score += 30;
        if (location && location !== 'Location Not Specified') score += 20;
        if (description && description.length >= 100 &&
            description !== 'Job description could not be extracted from this page') score += 25;
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

    async extractGeneric() {
        return {
            company: 'Generic Company Test',
            title: 'Generic Title Test',
            location: 'Generic Location Test',
            description: 'Generic description test for non-Workday sites',
            applicationUrl: window.location.href,
            url: window.location.href,
            extractedAt: new Date().toISOString(),
            siteDetected: 'Generic Site',
            extractionMethod: 'generic_fallback'
        };
    }
}

export default WorkdayExtractor;
