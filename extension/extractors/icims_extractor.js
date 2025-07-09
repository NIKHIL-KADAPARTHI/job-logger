// icims_extractor.js - Auto-frame loader & data extractor for ICIMS job pages

class IcimsExtractor {
    constructor() {
        this.currentSite = this.detectSite();
    }

    detectSite() {
        const hostname = window.location.hostname.toLowerCase();
        return hostname.includes('icims.com') ? 'icims' : 'unsupported';
    }

    async extractJobData() {
        if (this.currentSite !== 'icims') {
            return this.fallback('ICIMS Extraction Not Supported On This Domain');
        }

        const iframeUrl = this.buildIframeUrl(window.location.href);

        const iframe = await this.loadIframeAndWait(iframeUrl);

        const json = this.extractJsonFromIframe(iframe);
        if (!json) return this.fallback('Structured JSON Not Found');

        const jobData = {
            company: json.hiringOrganization?.name || 'Company Not Found',
            title: json.title || 'Title Not Found',
            location: json.jobLocation?.[0]?.address?.streetAddress || 'Location Not Found',
            description: this.extractPlainText(json.description),
            applicationUrl: json.url || iframeUrl,
            url: json.url || iframeUrl,
            extractedAt: new Date().toISOString(),
            siteDetected: 'ICIMS.com',
            extractionMethod: 'icims_auto_iframe'
        };

        // Add quality score
        jobData.qualityScore = this.calculateQualityScore(jobData);
        jobData.qualityGrade = this.getQualityGrade(jobData.qualityScore);
        return jobData;

    }

    fallback(msg) {
        return {
            company: msg,
            title: '',
            location: '',
            description: '',
            applicationUrl: window.location.href,
            url: window.location.href,
            extractedAt: new Date().toISOString(),
            siteDetected: 'Unsupported',
            extractionMethod: 'icims_auto_iframe'
        };
    }

    buildIframeUrl(currentUrl) {
        const url = new URL(currentUrl);
        url.searchParams.set('in_iframe', '1');
        return url.toString();
    }

    async loadIframeAndWait(iframeUrl) {
        return new Promise((resolve, reject) => {
            const iframe = document.createElement('iframe');
            iframe.src = iframeUrl;
            iframe.style.display = 'none';
            document.body.appendChild(iframe);

            iframe.onload = () => {
                try {
                    resolve(iframe);
                } catch (err) {
                    reject(err);
                }
            };

            setTimeout(() => reject(new Error('Iframe load timeout')), 10000); // timeout safety
        });
    }

    extractJsonFromIframe(iframe) {
        try {
            const scripts = iframe.contentDocument.querySelectorAll('script[type="application/ld+json"]');
            for (const script of scripts) {
                const text = script.textContent?.trim();
                if (!text) continue;
                const parsed = JSON.parse(text);
                if (parsed['@type'] === 'JobPosting') {
                    return parsed;
                }
            }
        } catch (e) {
            console.warn('Failed to read iframe contents due to cross-origin policy.');
        }
        return null;
    }

    extractPlainText(html) {
        const div = document.createElement('div');
        div.innerHTML = html || '';
        return div.innerText
            .replace(/\s{3,}/g, '\n\n')
            .replace(/\n{2,}/g, '\n\n')
            .trim();
    }
    calculateQualityScore({ company, title, location, description }) {
        let score = 0;
        if (company && company !== 'Company Not Found') score += 25;
        if (title && title !== 'Title Not Found') score += 30;
        if (location && location !== 'Location Not Found') score += 20;
        if (description && description.length >= 100) score += 25;
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

export default IcimsExtractor;