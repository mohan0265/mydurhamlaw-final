# Help & Support Widget - Implementation Notes

## Overview

The Help & Support widget will be a floating assistance button that provides:
- Quick troubleshooting guides
- Common issue resolutions
- Self-service help articles
- Escalation to Durmah or human support

## Widget Placement

**Location**: Bottom-right corner, coordinated with:
- Durmah (Legal Eagle Buddy) - Purple button
- AWY (Always With You) - Family presence indicator
- Help & Support - Question mark or info icon

**Z-index Management**: Ensure widgets don't overlap
- AWY: Bottom-right, lowest
- Durmah: Above AWY
- Help & Support: Top or left of other widgets

## Knowledge Base Integration

**Source**: `docs/help-support-kb.md`

**Search Functionality**:
- Student types issue (e.g., "download not working")
- Widget shows relevant KB articles
- Common issues highlighted first

**Categories**:
1. **Technical Issues**
   - Download problems (★ Most common)
   - Login/authentication
   - Browser compatibility
   - Sync issues

2. **Feature Help**
   - How to use Assignment Assistant
   - YAAG calendar navigation
   - Premier Lounge etiquette
   - Study Mode best practices

3. **Account & Billing**
   - Profile settings
   - Year level selection
   - Subscription management

4. **Academic Integrity**
   - AI usage guidelines
   - Citation requirements
   - Proper attribution

## UI Design

**Collapsed State**:
```
[?] or [i] icon button
```

**Expanded State**:
```
┌─────────────────────────────┐
│ How can we help?            │
│ ─────────────────────────── │
│ 🔍 Search for help...       │
│                             │
│ 📥 Download Issues          │
│ 📚 Using Features           │
│ 👤 Account & Settings       │
│ 🎓 Academic Integrity       │
│                             │
│ 💬 Chat with Durmah         │
│ 📧 Contact Support          │
└─────────────────────────────┘
```

## Integration with Durmah

**Handoff Flow**:
1. Student selects issue in Help widget
2. If KB article doesn't resolve issue
3. "Still need help?" button appears
4. Clicking opens Durmah with context pre-loaded

**Context Passing**:
```typescript
openDurmahWithContext({
  issue: 'download_not_working',
  browser: 'Chrome',
  attempted_solutions: ['checked_settings', 'restarted_browser'],
  article_viewed: 'help-support-kb.md#assignment-download-issues'
});
```

## Priority Implementation

**Phase 1** (MVP):
- [ ] Static floating button
- [ ] Modal with KB article list
- [ ] Search functionality
- [ ] Link to Durmah

**Phase 2** (Enhanced):
- [ ] AI-powered article suggestions
- [ ] Usage analytics (what people search for)
- [ ] Auto-detect common issues
- [ ] In-app walkthroughs

**Phase 3** (Advanced):
- [ ] Chat interface
- [ ] Screen recording for bug reports
- [ ] Ticket system integration
- [ ] Community-contributed solutions

## Key Insights from Download Issue Debug

**Lessons Learned**:
1. **Browser differences matter**: Always test in multiple browsers
2. **Chrome is most restrictive**: Provide Edge as fallback
3. **Clear user guidance prevents frustration**: Don't assume students know technical workarounds
4. **Preview before download**: Reduces unnecessary download attempts
5. **Form POST > JavaScript blobs**: Old-school methods avoid modern security blocks

**Student-Facing Messaging**:
- ✅ "Try Edge browser" not "Chrome is broken"
- ✅ "Change browser settings" with exact steps, not "fix your browser"
- ✅ "This is a browser security feature" not "it's not our fault"

## Files to Create

1. **Widget Component**:
   - `src/components/widgets/HelpSupportWidget.tsx`

2. **Knowledge Base**:
   - `docs/help-support-kb.md` ✅ (Created)
   - Future: Convert to database for dynamic updates

3. **Search Index**:
   - `src/utils/helpSearch.ts`
   - Fuzzy matching for common misspellings

4. **Analytics**:
   - Track which articles are viewed
   - Identify gaps in documentation
   - Measure resolution rate

## Success Metrics

- **Deflection Rate**: % of issues resolved without contacting support
- **Time to Resolution**: How quickly students find answers
- **Article Usefulness**: Thumbs up/down feedback
- **Search Effectiveness**: Query → article views → resolution

---

**Status**: Planning complete  
**Next Steps**: Implement Phase 1 when ready to expand widget ecosystem
