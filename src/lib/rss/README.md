# Automated RSS System - Smart Legal News Feed

## Overview

The automated RSS system provides intelligent, twice-daily updates of legal news from trusted UK sources. It eliminates wasteful polling and simulates a curated editorial cycle with comprehensive caching, logging, and monitoring.

## ✨ Key Features

### 🕕 Automated Scheduling

- **Twice-daily updates**: 6:00 AM and 6:00 PM UK time
- **Intelligent caching**: Only fetches when content has actually changed
- **Zero manual intervention**: Fully automated editorial cycle

### 🧠 Smart Caching System

- **ETag & Last-Modified headers**: Avoids redundant fetching
- **Multi-level caching**: Memory cache + Supabase persistent cache
- **Emergency fallback**: Serves stale content if all sources fail

### 📊 Comprehensive Logging

- **All operations logged**: Fetch attempts, successes, failures, cache operations
- **Performance monitoring**: Response times, error rates, article counts
- **UK time tracking**: All logs include local time for easy monitoring

### 🎯 Source Management

- **Trusted sources**: Law Gazette, UK Supreme Court, Ministry of Justice, Durham University, Legal Cheek
- **Source filtering**: Support for Durham-only, UK Legal-only, Government-only filters
- **Fallback mechanisms**: Automatic failover to cached content

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Cron Scheduler │────│  RSS Scheduler  │────│     Logger      │
│   (6AM & 6PM)   │    │ (Smart Caching) │    │ (Comprehensive) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  RSS API Route  │    │  Supabase Cache │    │   Monitor API   │
│  (Enhanced)     │    │   (Persistent)  │    │    (Testing)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📁 File Structure

```
src/lib/rss/
├── rssScheduler.ts     # Core scheduling and intelligent caching
├── cronScheduler.ts    # Twice-daily cron job management
├── logger.ts           # Comprehensive logging system
├── init.ts             # System initialization
├── schema.sql          # Database schema for Supabase
└── README.md           # This documentation

src/pages/api/
├── rss-news.ts         # Enhanced RSS API with smart caching
├── rss-scheduler.ts    # Scheduler control API
└── rss-test.ts         # Testing and monitoring API
```

## 🚀 Getting Started

### 1. Database Setup

Run the SQL schema in your Supabase SQL editor:

```bash
# Navigate to your Supabase project → SQL Editor
# Copy and execute the contents of schema.sql
```

### 2. Environment Variables

Ensure these are set in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or your production URL
```

### 3. Automatic Initialization

The system auto-initializes when the server starts. No manual setup required!

## 🔧 API Endpoints

### RSS News API (Enhanced)

```
GET /api/rss-news
GET /api/rss-news?filter=durham
GET /api/rss-news?filter=uk-legal
GET /api/rss-news?force=true
```

**Response includes:**

- `cacheStatus`: 'cached', 'live', 'emergency-cache'
- `lastUpdate`: Timestamp of last automated update
- `smartCacheEnabled`: Boolean indicating intelligent caching

### RSS Scheduler API

```
GET /api/rss-scheduler?action=status    # Get current status
GET /api/rss-scheduler?action=fetch     # Manual fetch (testing)
GET /api/rss-scheduler?action=cached    # Get cached articles
```

### RSS Testing API

```
GET /api/rss-test?test=all              # Comprehensive system test
GET /api/rss-test?test=scheduler        # Test scheduler only
GET /api/rss-test?test=cache           # Test caching only
GET /api/rss-test?test=logger          # Test logging only
GET /api/rss-test?test=manual-trigger  # Manual trigger test
```

## 📊 Monitoring & Logging

### Real-time Monitoring

```javascript
// Get recent logs
const logs = await RSSLogger.getInstance().getRecentLogs(50);

// Get error logs from last 24 hours
const errors = await RSSLogger.getInstance().getErrorLogs(24);

// Get performance statistics
const stats = await RSSLogger.getInstance().getPerformanceStats(24);
```

### Performance Metrics

- **Total fetches**: Number of RSS fetch attempts
- **Success rate**: Percentage of successful fetches
- **Average articles**: Average articles per successful fetch
- **Error rate**: Percentage of failed attempts
- **Response times**: Fetch duration tracking

### Log Levels

- `info`: Normal operations, successful fetches
- `warn`: Non-critical issues, cache misses
- `error`: Failed fetches, critical errors
- `debug`: Detailed debugging info (development only)

## 📅 Scheduling

### Automatic Schedule

- **Morning**: 6:00 AM UK time (22:00 UTC previous day)
- **Evening**: 6:00 PM UK time (10:00 UTC same day)

### Manual Control

```javascript
const scheduler = CronScheduler.getInstance();

// Start scheduled tasks
scheduler.start();

// Stop scheduled tasks
scheduler.stop();

// Get status
const status = scheduler.getStatus();

// Manual trigger (emergency)
const result = await scheduler.triggerManualFetch();
```

## 🛡️ Error Handling & Resilience

### Multi-level Fallbacks

1. **Primary**: Live RSS fetch from source
2. **Secondary**: Recent memory cache (5 minutes)
3. **Tertiary**: Persistent Supabase cache (24 hours)
4. **Emergency**: Stale cache (any age)

### Error Recovery

- **Automatic retry**: Next scheduled update
- **Error counting**: Disable problematic sources after 3 consecutive failures
- **Graceful degradation**: Continue with available sources

### Monitoring Alerts

- **High error rate**: >50% fetch failures
- **No recent updates**: >25 hours since last successful update
- **Cache corruption**: Invalid or empty cached data

## 🎛️ Configuration

### RSS Sources

Edit the `RSS_FEEDS` array in `rssScheduler.ts`:

```javascript
const RSS_FEEDS = [
  {
    name: "Law Gazette",
    url: "https://www.lawgazette.co.uk/rss",
    sourceType: "uk-legal",
  },
  // Add more sources...
];
```

### Timing Configuration

Modify cron expressions in `cronScheduler.ts`:

```javascript
// 6:00 AM UK (06:00 UTC)
const morningTask = cron.schedule("0 22 * * *", handler);

// 6:00 PM UK (18:00 UTC)
const eveningTask = cron.schedule("0 10 * * *", handler);
```

### Cache Settings

Adjust cache durations in `rssScheduler.ts`:

```javascript
const MEMORY_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const PERSISTENT_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const EMERGENCY_CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
```

## 🧪 Testing

### Comprehensive Test Suite

```bash
# Test entire system
curl "http://localhost:3000/api/rss-test?test=all"

# Test specific components
curl "http://localhost:3000/api/rss-test?test=scheduler"
curl "http://localhost:3000/api/rss-test?test=cache"
curl "http://localhost:3000/api/rss-test?test=logger"

# Manual trigger for testing
curl "http://localhost:3000/api/rss-test?test=manual-trigger"
```

### Expected Test Results

```json
{
  "success": true,
  "message": "All RSS system tests passed successfully ✅",
  "data": {
    "testResults": {
      "scheduler": { "success": true, "error": null },
      "cache": { "success": true, "error": null },
      "cron": { "success": true, "error": null },
      "logger": { "success": true, "error": null }
    },
    "overallStatus": "PASS"
  }
}
```

## 🔍 Troubleshooting

### Common Issues

#### 1. System Not Initializing

**Symptoms**: No cron jobs running, no automatic updates
**Solution**: Check server logs for initialization errors

```bash
# Check if system initialized
curl "http://localhost:3000/api/rss-scheduler?action=status"
```

#### 2. No Articles Being Cached

**Symptoms**: Empty cache, no recent updates
**Solution**: Test RSS sources individually

```bash
# Test specific source
curl "http://localhost:3000/api/rss-news?source=Law%20Gazette&force=true"
```

#### 3. High Error Rate

**Symptoms**: Many failed fetches in logs
**Solution**: Check RSS source availability

```bash
# Get error logs
curl "http://localhost:3000/api/rss-test?test=logger"
```

#### 4. Stale Cache

**Symptoms**: Very old articles, no fresh content
**Solution**: Force fresh fetch

```bash
# Force refresh
curl "http://localhost:3000/api/rss-news?force=true"
```

### Debug Mode

Add `?debug=true` to the legal news feed URL for detailed debugging information.

## 📈 Performance Optimization

### Best Practices

1. **Monitor cache hit rates**: Aim for >80% cache hits
2. **Track error patterns**: Identify problematic sources
3. **Optimize fetch timing**: Avoid peak traffic periods
4. **Regular log cleanup**: Automatic 7-day retention

### Scaling Considerations

- **Multiple instances**: Use distributed locks for cron jobs
- **Database performance**: Monitor Supabase query performance
- **Memory usage**: Limit memory cache size for large deployments
- **Network optimization**: Consider CDN for article images

## 🤝 Contributing

### Adding New RSS Sources

1. Add source configuration to `RSS_FEEDS` array
2. Test with `?test=scheduler` endpoint
3. Monitor error rates for 48 hours
4. Update documentation

### Modifying Schedule

1. Update cron expressions in `cronScheduler.ts`
2. Test with `?test=cron` endpoint
3. Monitor first few scheduled runs
4. Update documentation

### Custom Logging

```javascript
const logger = RSSLogger.getInstance();

// Custom log entries
logger.info("custom-source", "Custom operation completed", {
  customData: true,
  operationId: "abc123",
});
```

## 📚 References

- [RSS 2.0 Specification](https://www.rssboard.org/rss-specification)
- [node-cron Documentation](https://github.com/node-cron/node-cron)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)

---

**System Status**: ✅ Operational - Automated twice-daily updates active
**Last Updated**: August 2025
**Maintainer**: Caseway Development Team
