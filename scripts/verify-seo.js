#!/usr/bin/env node

/**
 * SEO Setup Verification Script
 * Run with: node scripts/verify-seo.js
 */

const https = require('https');
const http = require('http');

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

console.log('\n🔍 SEO Setup Verification\n');
console.log(`Testing: ${BASE_URL}\n`);

const tests = [];

// Test sitemap.xml
tests.push({
  name: 'Sitemap XML',
  url: `${BASE_URL}/sitemap.xml`,
  check: (data) => {
    return data.includes('<?xml') && data.includes('<urlset') && data.includes('<loc>');
  }
});

// Test news-sitemap.xml
tests.push({
  name: 'News Sitemap XML',
  url: `${BASE_URL}/news-sitemap.xml`,
  check: (data) => {
    return data.includes('<?xml') && data.includes('news:news') && data.includes('<urlset');
  }
});

// Test robots.txt
tests.push({
  name: 'Robots.txt',
  url: `${BASE_URL}/robots.txt`,
  check: (data) => {
    return data.includes('User-agent') && data.includes('Sitemap:');
  }
});

// Test manifest.json
tests.push({
  name: 'Manifest JSON',
  url: `${BASE_URL}/manifest.json`,
  check: (data) => {
    const json = JSON.parse(data);
    return json.name && json.icons && json.start_url;
  }
});

// Test homepage
tests.push({
  name: 'Homepage Meta Tags',
  url: `${BASE_URL}/`,
  check: (data) => {
    return data.includes('og:title') && 
           data.includes('og:description') && 
           data.includes('twitter:card');
  }
});

async function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    client.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({ status: res.statusCode, data });
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function runTests() {
  const results = {
    passed: 0,
    failed: 0,
    errors: []
  };

  for (const test of tests) {
    try {
      console.log(`⏳ Testing: ${test.name}...`);
      
      const { status, data } = await fetchUrl(test.url);
      
      if (status !== 200) {
        console.log(`❌ ${test.name}: HTTP ${status}`);
        results.failed++;
        results.errors.push(`${test.name}: HTTP ${status}`);
        continue;
      }
      
      const passed = test.check(data);
      
      if (passed) {
        console.log(`✅ ${test.name}: PASSED`);
        results.passed++;
      } else {
        console.log(`❌ ${test.name}: Check failed`);
        results.failed++;
        results.errors.push(`${test.name}: Content check failed`);
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.message}`);
      results.failed++;
      results.errors.push(`${test.name}: ${error.message}`);
    }
  }

  console.log('\n📊 Results:');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  
  if (results.errors.length > 0) {
    console.log('\n⚠️  Errors:');
    results.errors.forEach(error => console.log(`  - ${error}`));
  }

  console.log('\n💡 Next Steps:');
  console.log('1. Fix any failed tests');
  console.log('2. Update domain URLs in all files');
  console.log('3. Add Google Analytics ID in .env.local');
  console.log('4. Submit sitemaps to Google Search Console');
  console.log('5. Test with Google Rich Results tool');
  console.log('\nDocumentation: SEO_SETUP.md\n');
}

runTests();
