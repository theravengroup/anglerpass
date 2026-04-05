# SEO Post-Launch Checklist

## Search Engine Setup

1. [ ] Submit sitemap to Google Search Console — https://anglerpass.com/sitemap.xml
2. [ ] Submit sitemap to Bing Webmaster Tools (critical for ChatGPT/Copilot indexing)
3. [ ] Replace Google verification code placeholder in `app/layout.tsx` metadata.verification.google
4. [ ] Test all JSON-LD schemas at https://search.google.com/test/rich-results
5. [ ] Run Lighthouse audit — target LCP < 2.5s, CLS < 0.1, INP < 200ms

## AI Search Baseline

6. [ ] Query ChatGPT, Claude, and Perplexity for "private water fly fishing platform" and "fly fishing club management software" — record current citations to establish baseline

## Analytics

7. [ ] Set up Google Analytics 4
8. [ ] Set up Google Search Console and link to GA4

## Verification

9. [ ] Check robots.txt at https://anglerpass.com/robots.txt — verify all AI bots are allowed
10. [ ] Check sitemap at https://anglerpass.com/sitemap.xml — count all URLs
11. [ ] Verify llms.txt at https://anglerpass.com/llms.txt
12. [ ] Test OG images by sharing URLs on Twitter/LinkedIn/Facebook — confirm image renders
13. [ ] Verify canonical URLs on all pages via View Source or browser extensions
