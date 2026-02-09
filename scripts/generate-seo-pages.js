#!/usr/bin/env node
/**
 * Programmatic SEO Page Generator
 * Generates 5000+ topic-based quiz landing pages
 */

const fs = require('fs');
const path = require('path');

// Topic categories and subtopics
const categories = {
  programming: ['javascript', 'python', 'java', 'typescript', 'react', 'nodejs', 'sql', 'html', 'css', 'git', 'docker', 'aws', 'kubernetes', 'mongodb', 'postgresql', 'redis', 'graphql', 'rest-api', 'algorithms', 'data-structures', 'vue', 'angular', 'svelte', 'nextjs', 'expressjs', 'django', 'flask', 'ruby', 'go', 'rust', 'csharp', 'php', 'swift', 'kotlin', 'scala'],
  math: ['algebra', 'calculus', 'geometry', 'trigonometry', 'statistics', 'probability', 'linear-algebra', 'discrete-math', 'number-theory', 'combinatorics', 'differential-equations', 'complex-analysis', 'topology', 'set-theory', 'logic', 'graph-theory', 'numerical-methods', 'optimization', 'game-theory', 'cryptography'],
  science: ['physics', 'chemistry', 'biology', 'astronomy', 'geology', 'ecology', 'genetics', 'evolution', 'quantum-mechanics', 'thermodynamics', 'organic-chemistry', 'biochemistry', 'microbiology', 'neuroscience', 'meteorology', 'oceanography', 'paleontology', 'botany', 'zoology', 'environmental-science'],
  languages: ['spanish', 'french', 'german', 'japanese', 'chinese', 'korean', 'italian', 'portuguese', 'russian', 'arabic', 'hindi', 'turkish', 'dutch', 'swedish', 'polish', 'greek', 'hebrew', 'thai', 'vietnamese', 'indonesian'],
  history: ['ancient-history', 'medieval-history', 'modern-history', 'world-war-1', 'world-war-2', 'american-history', 'european-history', 'asian-history', 'african-history', 'latin-american-history', 'ancient-rome', 'ancient-greece', 'ancient-egypt', 'renaissance', 'industrial-revolution', 'cold-war', 'french-revolution', 'civil-rights', 'colonialism', 'imperialism'],
  business: ['marketing', 'finance', 'accounting', 'economics', 'management', 'entrepreneurship', 'sales', 'leadership', 'strategy', 'operations', 'supply-chain', 'hr-management', 'project-management', 'business-analytics', 'e-commerce', 'branding', 'consumer-behavior', 'negotiation', 'public-speaking', 'networking'],
  arts: ['music-theory', 'art-history', 'film-studies', 'literature', 'poetry', 'photography', 'graphic-design', 'architecture', 'theater', 'dance', 'painting', 'sculpture', 'classical-music', 'jazz', 'rock-music', 'opera', 'creative-writing', 'screenwriting', 'animation', 'game-design'],
  health: ['nutrition', 'fitness', 'psychology', 'first-aid', 'anatomy', 'pharmacology', 'mental-health', 'sleep-science', 'stress-management', 'mindfulness', 'yoga', 'meditation', 'cardiology', 'dermatology', 'immunology', 'pediatrics', 'geriatrics', 'sports-medicine', 'physical-therapy', 'occupational-therapy'],
  technology: ['ai', 'machine-learning', 'blockchain', 'cybersecurity', 'cloud-computing', 'iot', 'robotics', 'vr-ar', '5g', 'quantum-computing', 'deep-learning', 'nlp', 'computer-vision', 'big-data', 'devops', 'microservices', 'serverless', 'edge-computing', 'digital-transformation', 'data-engineering'],
  geography: ['countries', 'capitals', 'continents', 'oceans', 'mountains', 'rivers', 'climate', 'population', 'cultures', 'landmarks', 'deserts', 'rainforests', 'islands', 'volcanoes', 'earthquakes', 'national-parks', 'unesco-sites', 'urban-geography', 'political-geography', 'economic-geography'],
  law: ['constitutional-law', 'criminal-law', 'civil-law', 'contract-law', 'property-law', 'intellectual-property', 'employment-law', 'international-law', 'environmental-law', 'tax-law', 'corporate-law', 'family-law', 'immigration-law', 'human-rights', 'privacy-law'],
  education: ['teaching-methods', 'curriculum-design', 'assessment', 'special-education', 'early-childhood', 'higher-education', 'online-learning', 'educational-psychology', 'classroom-management', 'instructional-design', 'learning-theories', 'educational-technology', 'literacy', 'stem-education', 'gifted-education']
};

const levels = ['beginner', 'intermediate', 'advanced'];
const languages = ['en', 'zh', 'ja', 'de', 'fr', 'ko', 'es'];

const languageNames = {
  en: 'English',
  zh: '中文',
  ja: '日本語',
  de: 'Deutsch',
  fr: 'Français',
  ko: '한국어',
  es: 'Español'
};

// Generate pages
const pages = [];

// Generate topic pages: category × topic × level × language
for (const [category, topics] of Object.entries(categories)) {
  for (const topic of topics) {
    for (const level of levels) {
      for (const lang of languages) {
        pages.push({
          path: `/quiz/${lang}/${category}/${topic}/${level}`,
          topic: topic.replace(/-/g, ' '),
          category,
          level,
          lang
        });
      }
    }
  }
}

console.log(`Generated ${pages.length} pages`);

// Generate sitemap-topics.xml
let sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

for (const page of pages) {
  sitemapContent += `  <url>
    <loc>https://gamified-study.demo.densematrix.ai${page.path}</loc>
    <lastmod>2026-02-09</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
`;
}

sitemapContent += '</urlset>';

const publicDir = path.join(__dirname, '..', 'frontend', 'public');
fs.mkdirSync(publicDir, { recursive: true });
fs.writeFileSync(path.join(publicDir, 'sitemap-topics.xml'), sitemapContent);

console.log(`Sitemap written with ${pages.length} URLs`);

// Output stats
console.log('\\nStatistics:');
console.log(`- Categories: ${Object.keys(categories).length}`);
console.log(`- Topics per category: ~${Math.round(pages.length / Object.keys(categories).length / levels.length / languages.length)}`);
console.log(`- Levels: ${levels.length}`);
console.log(`- Languages: ${languages.length}`);
console.log(`- Total pages: ${pages.length}`);
