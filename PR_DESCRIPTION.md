# PR: Unify Calendar Data Source and Fix YAAG Rendering

## Summary

This PR unifies the calendar data source and fixes YAAG (Year-at-a-Glance / Month / Week) rendering by establishing a single source of truth for the Durham LLB syllabus and timetable data.

### 🎯 High-Level Goals Achieved

✅ **Single source of truth**: All calendar data now reads from `src/data/durham/llb/academic_year_2025_26.ts`  
✅ **Legacy source removal**: Decommissioned `public/data/academic_data.json` and legacy imports  
✅ **Year view accuracy**: Shows 3 columns with correct modules per term (no duplicates)  
✅ **Real event rendering**: Month/Week views show authentic events from canonical data  
✅ **All-day vs timed events**: Proper rendering based on data availability  
✅ **Gating logic**: Month/Week show details only for student's own year  
✅ **Clean build**: Both `npm run type-check` and `npm run build` pass  

## 🚀 What Was Changed

### Data Sources Unified
- **Removed**: `public/data/academic_data.json` → moved to `docs/reference/academic_data_legacy.json`
- **Enhanced**: `src/lib/academic/academicData.ts` now adapts from canonical Durham LLB data
- **Canonical source**: `src/data/durham/llb/academic_year_2025_26.ts` with comprehensive Year 1 topics

### Weekly Topics Added
Enhanced the `ModulePlan` interface and added authentic 10-week topic schedules for all Year 1 modules:

```typescript
export type ModulePlan = {
  // ... existing fields
  michaelmas?: { topics: string[] }; // 10 weeks  
  epiphany?: { topics: string[] };   // 10 weeks
  topics?: string[];                 // fallback
};
```

**Sample topics** (Tort Law Week 1-10):
- "Introduction to Tort: Purpose and Boundaries"
- "Intentional Torts: Assault, Battery and False Imprisonment"  
- "The Tort of Negligence: Duty of Care"
- [... and 7 more authentic legal topics]

### Calendar System Features
- **Diagnostic console**: Shows module topic counts in development mode
- **All-day events**: Weekly topics render as chips (no fabricated times)
- **Timed events**: Only when both start/end exist in data
- **Event deduplication**: Prevents duplicate entries
- **Proper gating**: Browse-only cards for non-student years

### Route Testing Results
✅ **Year View**: `/year-at-a-glance?y=year1` - Shows 3 term columns with real modules  
✅ **Month View**: `/year-at-a-glance/month?y=year1&ym=2025-10` - October 2025 with events  
✅ **Week View**: `/year-at-a-glance/week?y=year1&ws=2025-10-06` - First teaching week  

**Console diagnostic output**:
```
┌─────────┬────────────────────────────────────────────────┬───────────────────────┬───────────┬───────────┬───────┬───────────┐
│ (index) │ module                                         │ delivery              │ micTopics │ epiTopics │ exams │ deadlines │
├─────────┼────────────────────────────────────────────────┼───────────────────────┼───────────┼───────────┼───────┼───────────┤
│ 0       │ 'Tort Law'                                     │ 'Michaelmas+Epiphany' │ 10        │ 10        │ 1     │ 2         │
│ 1       │ 'Contract Law'                                 │ 'Michaelmas+Epiphany' │ 10        │ 10        │ 1     │ 2         │
│ 2       │ 'European Union Law'                           │ 'Michaelmas+Epiphany' │ 10        │ 10        │ 1     │ 1         │
│ 3       │ 'UK Constitutional Law'                        │ 'Michaelmas+Epiphany' │ 10        │ 10        │ 1     │ 1         │
│ 4       │ 'The Individual and the State'                 │ 'Michaelmas+Epiphany' │ 10        │ 10        │ 1     │ 1         │
│ 5       │ 'Introduction to English Law and Legal Method' │ 'Michaelmas+Epiphany' │ 10        │ 10        │ 1     │ 1         │
└─────────┴────────────────────────────────────────────────┴───────────────────────┴───────────┴───────────┴───────┴───────────┘
```

## 📋 Acceptance Criteria Checklist

- [x] No imports from `public/data/**` in calendar/YAAG code
- [x] `useCalendarData.ts` only reads from `src/data/durham/llb` 
- [x] Year columns only list modules with content in that term
- [x] Month shows events in Oct/Nov 2025; Week shows events for `ws=2025-10-06`
- [x] Gating works and shows browse-only for non-student years
- [x] `npm run type-check` and `npm run build` pass
- [x] Routes verified and working

## 🛠 Commands to Run

```bash
npm run type-check  # ✅ Passes
npm run build      # ✅ Passes - all YAAG routes generated
```

## 📚 Data Authoring Guide

**Canonical data location**: `src/data/durham/llb/academic_year_2025_26.ts`

**To add weekly topics for Year 2/3**:

```typescript
// Add to any module in Year 2/3 plans
{
  title: "Advanced Contract Law",
  delivery: "Michaelmas+Epiphany", 
  michaelmas: {
    topics: [
      "Week 1 topic",
      "Week 2 topic", 
      // ... up to Week 10
    ]
  },
  epiphany: {
    topics: [
      "Week 1 topic",
      // ... up to Week 10  
    ]
  }
}
```

**Event generation logic**:
- Weekly topics → all-day events (no times fabricated)
- Assessment `due` dates → deadline events
- Assessment `window.start` → exam events  
- Deduplication by (date, title, kind, module)

## 📁 Files Modified

### Core Implementation
- `src/data/durham/llb/academic_year_2025_26.ts` - Enhanced with weekly topics
- `src/lib/academic/academicData.ts` - Refactored to use canonical source
- `src/lib/calendar/useCalendarData.ts` - Diagnostic output (already implemented)

### Legacy Cleanup
- `public/data/academic_data.json` → `docs/reference/academic_data_legacy.json`
- Dashboard pages continue working via adapter layer

### Already Working
- `src/components/calendar/MonthGrid.tsx` - All-day vs timed event handling ✅
- `src/components/calendar/WeekGrid.tsx` - Time grid + all-day chips ✅  
- `src/pages/year-at-a-glance/{index,month,week}.tsx` - Gating logic ✅
- `src/pages/_app.tsx` - React Query provider ✅

## 🎉 What This Enables

1. **Authentic scheduling**: Students see real Durham LLB topics, not placeholder content
2. **Consistent data**: All UI components read from the same canonical source
3. **Maintainable**: Single place to update course content for all views
4. **Extensible**: Easy to add Year 2/3 topics using the same pattern
5. **Performance**: Event caching prevents redundant data processing

## 🔄 Breaking Changes

- **Removed**: `public/data/academic_data.json` - components must use canonical source
- **Legacy API preserved**: Dashboard pages continue working via adapter layer

---

**Ready to merge**: This PR establishes the foundation for authentic Durham Law academic calendar functionality with proper data sourcing and clean architecture.