// job_extractor.js — Handles enhanced and fallback job extraction

export async function extractJobDataEnhanced() {
    console.log('🚀 Starting enhanced job data extraction...');

    const hostname = window.location.hostname.toLowerCase();

    try {
        if (hostname.includes('naukri.com')) {
            const module = await import(chrome.runtime.getURL('extractors/naukri_extractor.js'));
            return await new module.default().extractJobData();
        }

        if (hostname.includes('greenhouse.io')) {
            const module = await import(chrome.runtime.getURL('extractors/greenhouse_extractor.js'));
            return await new module.default().extractJobData();
        }

        if (hostname.includes('lever.co')) {
            const module = await import(chrome.runtime.getURL('extractors/lever_extractor.js'));
            return await new module.default().extractJobData();
        }

        if (hostname.includes('builtin.com')) {
            const module = await import(chrome.runtime.getURL('extractors/builtin_extractor.js'));
            return await new module.default().extractJobData();
        }

        if (hostname.includes('myworkdayjobs.com')) {
            const module = await import(chrome.runtime.getURL('extractors/workday_extractor.js'));
            return await new module.default().extractJobData();
        }

        if (hostname.includes('icims.com')) {
            const module = await import(chrome.runtime.getURL('extractors/icims_extractor.js'));
            return await new module.default().extractJobData();
        }

        if (hostname.includes('smartrecruiters.com')) {
            const module = await import(chrome.runtime.getURL('extractors/smartrecruiters_extractor.js'));
            return await new module.default().extractJobData();
        }

        // ✅ Fallback: generic fallback extractor
        const fallbackModule = await import(chrome.runtime.getURL('extractors/generic_fallback_extractor.js'));
        return await new fallbackModule.default().extractJobData();

    } catch (error) {
        console.error('❌ Enhanced extractor failed:', error);
        return await extractJobDataBasic();
    }

}

export async function extractJobDataBasic() {
    console.log('🔍 Performing basic extraction...');
    await new Promise(resolve => setTimeout(resolve, 800));

    const jobData = {
        company: extractCompanyBasic(),
        title: extractJobTitleBasic(),
        location: extractLocationBasic(),
        description: extractDescriptionBasic(),
        applicationUrl: window.location.href,
        url: window.location.href,
        extractedAt: new Date().toISOString(),
        extractionTime: 800,
        qualityScore: 60,
        qualityGrade: 'C (Basic)',
        extractionMethod: 'basic',
        siteDetected: 'Generic Site'
    };

    console.log('📊 Basic extraction completed:', jobData);
    return jobData;
}

function extractCompanyBasic() {
    const siteName = document.querySelector('meta[property="og:site_name"]')?.content;
    if (siteName && siteName.length < 100) return siteName;

    const selectors = ['.company-name', '.employer-name', '[data-company]'];
    for (const selector of selectors) {
        const el = document.querySelector(selector);
        if (el?.textContent?.trim()) return el.textContent.trim();
    }

    const domain = window.location.hostname.replace('www.', '').split('.')[0];
    return domain.charAt(0).toUpperCase() + domain.slice(1);
}

function extractJobTitleBasic() {
    const h1 = document.querySelector('h1');
    if (h1?.textContent?.trim()) return h1.textContent.trim();

    const selectors = ['.job-title', '.position-title', '[data-job-title]'];
    for (const selector of selectors) {
        const el = document.querySelector(selector);
        if (el?.textContent?.trim()) return el.textContent.trim();
    }

    return document.title.split(' - ')[0] || document.title;
}

function extractLocationBasic() {
    const selectors = ['.location', '.job-location', '[data-location]'];
    for (const selector of selectors) {
        const el = document.querySelector(selector);
        if (el?.textContent?.trim()) return el.textContent.trim();
    }
    return 'Remote';
}

function extractDescriptionBasic() {
    const selectors = ['.job-description', '.description', '.content', 'main'];
    for (const selector of selectors) {
        const el = document.querySelector(selector);
        if (el?.textContent?.trim() && el.textContent.length > 100) {
            return el.textContent.trim().substring(0, 2000);
        }
    }
    return 'Job description not found';
}
