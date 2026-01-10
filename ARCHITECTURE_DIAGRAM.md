# 🏗️ Optimized Architecture - Request Flow Diagram

## Before Optimization (BAD) ❌

```
┌─────────────────────────────────────────────────────────────────────┐
│                           EVERY REQUEST                              │
│                                  ↓                                   │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │                      Vercel Edge Network                    │    │
│  │  - Middleware runs (checks user-agent, sets headers)       │    │
│  │  - Edge CPU consumed on EVERY request                      │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                  ↓                                   │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │              Vercel Serverless Function (SSR)               │    │
│  │  - layout.tsx: force-dynamic, revalidate=0                 │    │
│  │  - Page rendered on EVERY request                          │    │
│  │  - Server Actions called (ads, user data)                  │    │
│  │  - MASSIVE CPU CONSUMPTION                                 │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                  ↓                                   │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │                       Supabase Database                     │    │
│  │  - Queries executed on every request                       │    │
│  │  - No caching, repeated identical queries                  │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                  ↓                                   │
│                         HTML Response (SSR)                          │
│                                                                       │
│  RESULT: 10,000+ function invocations/day, 3,000+ CPU seconds/day   │
└─────────────────────────────────────────────────────────────────────┘

FILE UPLOADS (WORST OFFENDER):
┌─────────┐      FormData       ┌──────────────┐     S3 SDK      ┌──────────┐
│ Browser │ ─────────────────► │Vercel Function│ ──────────────► │ R2 (CDN) │
│         │  (50MB video file)  │ (proxy file) │  (relay file)   │          │
└─────────┘                      └──────────────┘                 └──────────┘
                                        ↓
                              HUGE CPU SPIKE (3-10s)
                              Function timeout risk
```

---

## After Optimization (GOOD) ✅

```
┌─────────────────────────────────────────────────────────────────────┐
│                      REQUEST (Browser/Bot)                           │
└────────────────────────────────┬────────────────────────────────────┘
                                 ↓
                    ┌────────────────────────┐
                    │  Is it a POST page?    │
                    └────────────┬───────────┘
                            Yes ↓           ↓ No
              ┌─────────────────────┐       │
              │  Vercel Middleware  │       │ (Skip middleware)
              │  (bot detection)    │       │
              │  - Minimal logic    │       │
              │  - 24hr cache       │       │
              └─────────┬───────────┘       │
                        ↓                   ↓
        ┌───────────────────────────────────────────────┐
        │         Vercel Edge CDN Cache                 │
        │  - Static pages: cached forever              │
        │  - ISR pages: cached 5 min                   │
        │  - Bot responses: cached 24 hours            │
        └───────────────┬───────────────────────────────┘
                        │ Cache MISS (rare)
                        ↓
        ┌───────────────────────────────────────────────┐
        │      Vercel Serverless Function (ISR)         │
        │  - Only for cache misses                     │
        │  - Runs once per revalidate period           │
        │  - Results cached for next requests          │
        └───────────────┬───────────────────────────────┘
                        ↓
        ┌───────────────────────────────────────────────┐
        │           Supabase (with caching)             │
        │  - Ads: cached 5 min (unstable_cache)        │
        │  - Link previews: cached 1 hour              │
        │  - Sitemap: cached 1 hour                    │
        └───────────────────────────────────────────────┘
                        ↓
                HTML Response (cached)

RESULT: ~1,000 function invocations/day, ~300 CPU seconds/day
        90% reduction in costs
```

---

## FILE UPLOADS (OPTIMIZED) ✅

```
Step 1: Request Pre-Signed URL (Lightweight)
┌─────────┐     JSON request      ┌──────────────┐    S3 SDK (URL only)
│ Browser │ ───────────────────► │Vercel Function│ ────────────────┐
│         │  { key, contentType } │  (50ms exec)  │                 │
└─────────┘                        └───────┬───────┘                │
                                          │ Returns presigned URL   │
                                          ↓                          ↓
                                   ┌─────────────────────────────────┴──┐
                                   │    { presignedUrl, publicUrl }     │
                                   └─────────┬──────────────────────────┘
                                             ↓
Step 2: Direct Upload to R2 (Bypasses Vercel)
┌─────────┐      PUT request       ┌──────────────────────────────────┐
│ Browser │ ───────────────────► │  Cloudflare R2 (Direct)          │
│         │  (50MB video file)    │  - No Vercel CPU consumed        │
└─────────┘                        │  - Unlimited bandwidth (free)   │
                                   └──────────────────────────────────┘

RESULT: 
- Vercel Function: 50ms (just to generate URL)
- R2 Upload: Direct, no Vercel CPU
- 95% reduction in upload CPU time
```

---

## BREAKDOWN BY PAGE TYPE

### Homepage (/)
**Before**: 
```
Request → Middleware → SSR Function → Supabase (ads, posts) → HTML
Time: ~500-1000ms per request
Function invocation: EVERY visit
```

**After**:
```
Request → CDN (static HTML) → Client-side React Query → Supabase
Time: ~50-100ms (CDN)
Function invocation: ZERO (client-side only)
Ads: Cached 5 min via Server Action
```

---

### Post Page (/post/[id])
**Before**:
```
Request → Middleware → SSR Function → Supabase → HTML
Time: ~300-800ms per request
Function invocation: EVERY visit (including bots)
```

**After**:
```
Bot Request → Middleware → CDN (24hr cache) → HTML
Human Request → CDN (5min ISR cache) → HTML
Time: ~20-50ms (CDN hit), ~200ms (cache miss)
Function invocation: Once per 5 minutes (not per request)
Bot requests: Cached 24 hours (massive savings)
```

---

### API Routes

#### Link Preview
**Before**:
```
Request → Function → Fetch URL → Parse HTML → Response
Time: ~1-3 seconds per request
Function invocation: EVERY preview request
```

**After**:
```
Request → Function → Check cache → Return cached result
Time: ~10-50ms (cache hit), ~1-3s (cache miss)
Cache hit rate: ~90%
Function invocation: 90% fewer
```

#### File Upload
**Before**:
```
Request → Function → Receive file → Upload to R2 → Response
Time: 3-10 seconds (based on file size)
CPU: MASSIVE (especially for videos)
```

**After**:
```
Request → Function → Generate presigned URL → Response
Time: ~50ms (regardless of file size)
CPU: Minimal (no file data processed)
Client uploads directly to R2 (bypasses Vercel)
```

---

## TRAFFIC PATTERN ANALYSIS

### Typical Daily Traffic (Estimated)
- **Homepage visits**: 500
- **Post page visits**: 800 (300 bots, 500 humans)
- **Explore page**: 200
- **API calls**: 1,000 (link preview, ads, uploads)
- **Bot traffic**: 500 (sitemap, RSS, social media crawlers)

### Function Invocations

**Before Optimization**:
```
Homepage:        500 visits × 1 invocation = 500
Post pages:      800 visits × 1 invocation = 800
Bot traffic:     500 visits × 1 invocation = 500
API calls:      1,000 requests × 1 invocation = 1,000
Ads fetching:    500 page loads × 2 actions = 1,000
Link previews:  1,000 requests × 1 invocation = 1,000
Sitemap/RSS:     200 bot requests × 1 invocation = 200
                                      ─────────────────
                                      TOTAL: ~5,000/day
```

**After Optimization**:
```
Homepage:        500 visits × 0 invocations = 0 (static)
Post pages:      800 visits ÷ 288 (5min) = 3 (ISR)
Bot traffic:     500 visits ÷ 24 (1day) = 21 (cached)
API calls:      1,000 requests × 0.1 (cached) = 100
Ads fetching:    500 page loads ÷ 288 (5min) = 2 (cached)
Link previews:  1,000 requests × 0.1 (cached) = 100
Sitemap/RSS:     200 bot requests ÷ 24 (1hr) = 8
                                      ─────────────────
                                      TOTAL: ~234/day
```

**Reduction: 95% (from 5,000 to 234)**

---

## CPU TIME ANALYSIS

**Before Optimization**:
```
SSR (all pages):     5,000 invocations × 0.3s = 1,500s
File uploads:           10 uploads × 5s = 50s
Link previews:      1,000 requests × 0.2s = 200s
Supabase queries:   5,000 queries × 0.1s = 500s
                                    ─────────────
                                    TOTAL: 2,250s/day
```

**After Optimization**:
```
ISR (cached):          234 invocations × 0.2s = 47s
File uploads:           10 uploads × 0.05s = 0.5s (presigned URL only)
Link previews:         100 requests × 0.2s = 20s (90% cached)
Supabase queries:      234 queries × 0.1s = 23s
                                    ─────────────
                                    TOTAL: ~90s/day
```

**Reduction: 96% (from 2,250s to 90s)**

---

## COST IMPLICATIONS (Vercel Free Plan)

### Free Plan Limits:
- **Function Invocations**: 100,000/month
- **Fluid Active CPU**: 100 hours/month = 360,000 seconds
- **Edge Requests**: 100,000/month

### Before Optimization (Monthly):
```
Function Invocations: 5,000/day × 30 = 150,000/month ❌ OVER LIMIT
Fluid Active CPU: 2,250s/day × 30 = 67,500s/month ✅ Within limit (barely)
Edge Requests: 8,000/day × 30 = 240,000/month ❌ OVER LIMIT
```

### After Optimization (Monthly):
```
Function Invocations: 234/day × 30 = 7,020/month ✅ 7% of limit
Fluid Active CPU: 90s/day × 30 = 2,700s/month ✅ 0.75% of limit
Edge Requests: 2,000/day × 30 = 60,000/month ✅ 60% of limit
```

**Result: Comfortably within all Vercel Free plan limits** ✅

---

## MONITORING DASHBOARD (What to Watch)

### Key Metrics to Track (Vercel Dashboard):

1. **Function Invocations** (Real-time)
   - Target: <300/day
   - Alert if: >1,000/day
   - Primary cause if high: Check for uncached pages

2. **Fluid Active CPU** (Real-time)
   - Target: <100 seconds/day
   - Alert if: >500 seconds/day
   - Primary cause if high: Check for file uploads or heavy queries

3. **Edge Requests** (Real-time)
   - Target: <2,500/day
   - Alert if: >5,000/day
   - Primary cause if high: Check middleware matcher

4. **Cache Hit Rate** (Analytics)
   - Target: >90%
   - If low: Check ISR revalidate times

---

## SUCCESS METRICS (After 48 Hours)

✅ **Critical Success Factors**:
- Function invocations: <10,000/month
- CPU time: <5,000 seconds/month
- No "exceeding limits" warnings
- Build output: 90%+ static or ISR pages

✅ **Performance Improvements**:
- Homepage load time: <500ms (was ~1000ms)
- Post page load time: <300ms (was ~800ms)
- File uploads: Instant presigned URL, direct to R2

✅ **Cost Savings**:
- Stay on Vercel Free plan
- No need to upgrade ($20/month saved)
- Scalable to 10x traffic without hitting limits

---

**End of Architecture Diagram** 🎯
