# domains_config.py - Comprehensive Job Domain Configuration

DOMAINS = [
    # TECHNICAL DOMAINS
    {
        "id": "software_development",
        "display_name": "Software Development",
        "keywords": ["developer", "programming", "coding", "software", "full stack", "frontend", "backend"],
        "active": True
    },
    {
        "id": "devops",
        "display_name": "DevOps & Infrastructure", 
        "keywords": ["devops", "infrastructure", "deployment", "kubernetes", "docker", "aws", "cloud"],
        "active": True
    },
    {
        "id": "cybersecurity",
        "display_name": "Cybersecurity",
        "keywords": ["security", "cyber", "infosec", "penetration", "compliance", "firewall", "encryption"],
        "active": True
    },
    {
        "id": "data_science",
        "display_name": "Data Science",
        "keywords": ["data scientist", "machine learning", "ai", "deep learning", "python", "modeling"],
        "active": True
    },
    {
        "id": "data_analytics",
        "display_name": "Data Analytics",
        "keywords": ["data analyst", "analytics", "sql", "excel", "reporting", "power bi", "tableau"],
        "active": True
    },
    {
        "id": "mobile_development",
        "display_name": "Mobile Development",
        "keywords": ["mobile", "ios", "android", "react native", "flutter", "swift", "kotlin"],
        "active": True
    },
    {
        "id": "web_development",
        "display_name": "Web Development",
        "keywords": ["web", "html", "css", "javascript", "react", "angular", "vue"],
        "active": True
    },
    {
        "id": "cloud_engineering",
        "display_name": "Cloud Engineering",
        "keywords": ["cloud", "aws", "azure", "gcp", "serverless", "microservices"],
        "active": True
    },
    {
        "id": "database_administration",
        "display_name": "Database Administration",
        "keywords": ["database", "dba", "mysql", "postgresql", "mongodb", "oracle"],
        "active": True
    },
    {
        "id": "qa_testing",
        "display_name": "QA & Testing",
        "keywords": ["testing", "qa", "quality assurance", "automation", "selenium", "test"],
        "active": True
    },
    {
        "id": "ui_ux_design",
        "display_name": "UI/UX Design",
        "keywords": ["design", "ui", "ux", "user experience", "figma", "adobe", "prototype"],
        "active": True
    },
    {
        "id": "technical_writing",
        "display_name": "Technical Writing",
        "keywords": ["technical writer", "documentation", "content", "api docs"],
        "active": True
    },
    {
        "id": "network_engineering",
        "display_name": "Network Engineering",
        "keywords": ["network", "cisco", "routing", "switching", "firewall", "vpn"],
        "active": True
    },
    {
        "id": "blockchain",
        "display_name": "Blockchain & Cryptocurrency",
        "keywords": ["blockchain", "crypto", "bitcoin", "ethereum", "solidity", "defi"],
        "active": True
    },
    {
        "id": "game_development",
        "display_name": "Game Development",
        "keywords": ["game", "unity", "unreal", "gaming", "3d", "graphics"],
        "active": True
    },
    
    # NON-TECHNICAL DOMAINS
    {
        "id": "engineering_manager",
        "display_name": "Engineering Manager",
        "keywords": ["engineering manager", "tech lead", "engineering leadership", "head of engineering", "director of engineering"],
        "active": True
    },
    {
        "id": "product_management",
        "display_name": "Product Management",
        "keywords": ["product manager", "pm", "product owner", "roadmap", "strategy"],
        "active": True
    },
    {
        "id": "project_management",
        "display_name": "Project Management",
        "keywords": ["project manager", "scrum", "agile", "pmp", "coordination"],
        "active": True
    },
    {
        "id": "business_analyst",
        "display_name": "Business Analysis",
        "keywords": ["business analyst", "requirements", "process", "workflow"],
        "active": True
    },
    {
        "id": "sales",
        "display_name": "Sales & Business Development",
        "keywords": ["sales", "business development", "account manager", "revenue"],
        "active": True
    },
    {
        "id": "marketing",
        "display_name": "Marketing & Growth",
        "keywords": ["marketing", "growth", "seo", "social media", "campaigns"],
        "active": True
    },
    {
        "id": "human_resources",
        "display_name": "Human Resources",
        "keywords": ["hr", "human resources", "recruitment", "talent", "people"],
        "active": True
    },
    {
        "id": "finance",
        "display_name": "Finance & Accounting",
        "keywords": ["finance", "accounting", "financial", "cfo", "budget"],
        "active": True
    },
    {
        "id": "legal",
        "display_name": "Legal & Compliance",
        "keywords": ["legal", "lawyer", "compliance", "attorney", "contract"],
        "active": True
    },
    {
        "id": "supplychain",
        "display_name": "Operations & Supply Chain",
        "keywords": ["operations", "supply chain", "logistics", "procurement"],
        "active": True
    },
    {
        "id": "customer_success",
        "display_name": "Customer Success & Support",
        "keywords": ["customer success", "support", "customer service", "account management"],
        "active": True
    },
    {
        "id": "content_creation",
        "display_name": "Content & Creative",
        "keywords": ["content", "creative", "copywriter", "social media", "brand"],
        "active": True
    },
    {
        "id": "consulting",
        "display_name": "Consulting & Strategy",
        "keywords": ["consultant", "strategy", "advisory", "management consulting"],
        "active": True
    },
    {
        "id": "healthcare",
        "display_name": "Healthcare & Medical",
        "keywords": ["healthcare", "medical", "nurse", "doctor", "clinical"],
        "active": True
    },
    {
        "id": "education",
        "display_name": "Education & Training",
        "keywords": ["education", "teacher", "training", "instructor", "academic"],
        "active": True
    },
    {
        "id": "research",
        "display_name": "Research & Development",
        "keywords": ["research", "r&d", "scientist", "lab", "innovation"],
        "active": True
    }
]

def get_active_domains():
    """Get all active domains"""
    return [domain for domain in DOMAINS if domain['active']]

def get_domain_by_id(domain_id):
    """Get specific domain by ID"""
    for domain in DOMAINS:
        if domain['id'] == domain_id:
            return domain
    return None

def get_domains_for_dropdown():
    """Get domains formatted for dropdown display"""
    active_domains = get_active_domains()
    return [(domain['id'], domain['display_name']) for domain in active_domains]

def suggest_domain_from_text(job_title, job_description=""):
    """Suggest domain based on job content"""
    text = f"{job_title} {job_description}".lower()
    
    domain_scores = {}
    for domain in get_active_domains():
        score = 0
        for keyword in domain['keywords']:
            if keyword.lower() in text:
                score += 1
        domain_scores[domain['id']] = score
    
    # Return domain with highest score, or None if no matches
    if max(domain_scores.values()) > 0:
        return max(domain_scores, key=domain_scores.get)
    return None

# For debugging - print all domains
if __name__ == "__main__":
    print("📋 Available Domains:")
    for domain in get_active_domains():
        print(f"  - {domain['display_name']} ({domain['id']})")
    print(f"\n📊 Total Active Domains: {len(get_active_domains())}")