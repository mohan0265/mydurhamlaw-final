# Caseway - Milestone 4 Post-Apply Instructions

## Required Commands After Applying Patch

### 1. Install Dependencies

```bash
# Ensure Node 20 is active
nvm use 20

# Install dependencies
pnpm install
# or
npm install
```

### 2. Database Verification

```bash
# Verify Supabase connection
psql "your_supabase_connection_string" -c "\dt"

# Check required tables exist:
# - assignments
# - deadlines
# - user_profiles
# - planner_data (if exists)
```

### 3. Build Verification

```bash
# Type checking
pnpm type-check

# Full build
pnpm build

# Start development
pnpm dev
```

## Manual Verification Steps

### 📅 **Year-at-a-Glance Core Testing**

#### **Main Interface (`/planner/year-at-a-glance`):**

- [ ] Page loads successfully without errors
- [ ] Defaults to current academic year (2025-26)
- [ ] Displays 3 terms: Michaelmas, Hilary, Easter
- [ ] Academic year format shown correctly ("2025-26")
- [ ] Teaching weeks numbered and visually distinct

#### **Year Navigation:**

- [ ] **Left Arrow (←):** Navigate to previous year (2024-25)
- [ ] **Right Arrow (→):** Navigate to next year (2026-27)
- [ ] **Current Year Indicator:** 2025-26 prominently highlighted
- [ ] **Year Labels:** Academic format displayed correctly
- [ ] **Smooth Transitions:** No jarring navigation between years

#### **Drill-Down Logic:**

- [ ] **Current Year (2025-26):** Click month → detailed month view
- [ ] **Current Year:** Click week → week planning interface
- [ ] **Past Year (2024-25):** View-only, no drill-down clicks
- [ ] **Future Year (2026-27):** View-only, no drill-down clicks
- [ ] **Visual Indicators:** Clear distinction between interactive vs. view-only

### 📏 **Academic Calendar Integration**

#### **Term Structure:**

- [ ] **Michaelmas Term:** October-December display
- [ ] **Hilary Term:** January-March display
- [ ] **Easter Term:** April-June display
- [ ] **Reading Weeks:** Identified and visually distinct
- [ ] **Assessment Periods:** Highlighted appropriately

#### **Teaching Weeks:**

- [ ] **Week Numbers:** Properly numbered (1-8 typically per term)
- [ ] **Current Week:** Highlighted if in teaching period
- [ ] **Visual Hierarchy:** Clear week boundaries and labels
- [ ] **Academic Context:** University-specific calendar alignment

#### **Personal Data Integration:**

- [ ] **Assignments:** Personal deadlines display correctly
- [ ] **Progress Indicators:** Completion status visible
- [ ] **Deadline Overlays:** Upcoming deadlines highlighted
- [ ] **Real-Time Sync:** Changes reflect immediately

### 📱 **Responsive Design Testing**

#### **Desktop (> 1024px):**

- [ ] **Horizontal Layout:** Terms displayed side-by-side
- [ ] **Full Navigation:** All year controls accessible
- [ ] **Detailed View:** Complete drill-down functionality
- [ ] **Performance:** Smooth interactions and transitions

#### **Tablet (768px - 1024px):**

- [ ] **Adaptive Layout:** Terms stack appropriately
- [ ] **Touch Navigation:** Year arrows touch-friendly
- [ ] **Drill-Down:** Month/week navigation works
- [ ] **Scroll Behavior:** Smooth vertical/horizontal scrolling

#### **Mobile (< 768px):**

- [ ] **Stacked Layout:** Vertical term arrangement
- [ ] **Touch Optimization:** Large tap targets (44px minimum)
- [ ] **Swipe Navigation:** Left/right swipe for year navigation
- [ ] **Performance:** Fast loading on mobile networks

### 🔄 **Data Flow Verification**

#### **Supabase Integration:**

- [ ] **Real Data Loading:** No mock data, only database content
- [ ] **Authentication:** User-specific assignments display
- [ ] **RLS Enforcement:** Students only see their own data
- [ ] **Error Handling:** Graceful failures when data unavailable

#### **Performance Testing:**

- [ ] **Initial Load:** < 2 seconds for year overview
- [ ] **Navigation:** < 500ms between years
- [ ] **Drill-Down:** < 300ms for month/week transitions
- [ ] **Large Datasets:** Performance with 50+ assignments

#### **Data Consistency:**

- [ ] **Assignment Dates:** Correctly placed in calendar
- [ ] **Deadline Accuracy:** Precise timing and alerts
- [ ] **Progress Sync:** Completion status updates correctly
- [ ] **Calendar Alignment:** Durham academic dates accurate

### ⚙️ **Advanced Feature Testing**

#### **Time Awareness:**

- [ ] **Current Period:** Today's date highlighted
- [ ] **Upcoming Deadlines:** Color-coded proximity indicators
- [ ] **Academic Context:** Current term/week emphasized
- [ ] **Deadline Alerts:** Visual warnings for approaching due dates

#### **Interactive Elements:**

- [ ] **Quick Actions:** Add assignment/deadline buttons
- [ ] **Drag & Drop:** Reschedule assignments (if implemented)
- [ ] **Search Integration:** Find assignments across year
- [ ] **Keyboard Navigation:** Tab through all interactive elements

#### **Accessibility Features:**

- [ ] **Screen Reader:** Proper ARIA labels and descriptions
- [ ] **Keyboard Only:** Complete navigation without mouse
- [ ] **High Contrast:** WCAG 2.1 AA compliance
- [ ] **Focus Indicators:** Clear visual focus states

### 🔍 **Edge Case Testing**

#### **Data Scenarios:**

- [ ] **Empty State:** New student with no assignments
- [ ] **Heavy Load:** Student with many assignments/deadlines
- [ ] **Year Transition:** Behavior during academic year change
- [ ] **Network Issues:** Offline behavior and error recovery

#### **Browser Compatibility:**

- [ ] **Chrome/Edge:** Full functionality
- [ ] **Firefox:** Complete feature support
- [ ] **Safari:** iOS/macOS optimization
- [ ] **Mobile Browsers:** Touch interaction quality

## Troubleshooting Guide

### **Common Issues & Solutions**

#### **"Year-at-a-glance not loading"**

- Check network connectivity to Supabase
- Verify authentication is working
- Check browser console for JavaScript errors
- Ensure environment variables are set correctly

#### **"No assignments showing"**

- Verify user has assignments in database
- Check RLS policies allow data access
- Confirm date ranges are correct
- Test with known assignment data

#### **"Year navigation not working"**

- Check for JavaScript errors in console
- Verify click handlers are bound correctly
- Test on different browsers
- Check for CSS conflicts preventing clicks

#### **"Drill-down not functioning"**

- Verify current year vs. past/future logic
- Check route generation for month/week pages
- Ensure proper component mounting
- Test navigation state management

### **Debug Commands**

#### **Data Debugging:**

```javascript
// Check current academic year detection
console.log("Current Academic Year:", getCurrentAcademicYear());

// Verify assignment data
console.log("Student Assignments:", window.plannerData);

// Check drill-down permissions
console.log("Drill-down enabled:", isDrillDownEnabled(currentYear));
```

#### **Performance Debugging:**

```bash
# Bundle analysis
npx @next/bundle-analyzer

# Component profiling
# Use React DevTools Profiler to identify slow renders

# Database query performance
# Check Supabase dashboard for slow queries
```

## Feature Verification Checklist

### ✅ **Core Functionality:**

- [ ] Year-at-a-glance loads and displays correctly
- [ ] Academic year navigation (arrows) works
- [ ] Current year defaults to 2025-26
- [ ] Drill-down available only for current year
- [ ] Past/future years are view-only

### ✅ **Academic Integration:**

- [ ] Durham Law calendar accurately represented
- [ ] Teaching weeks numbered correctly
- [ ] Assessment periods highlighted
- [ ] Personal assignments integrated
- [ ] Time-aware highlighting functional

### ✅ **User Experience:**

- [ ] Responsive design works on all devices
- [ ] Performance meets speed requirements
- [ ] Accessibility standards met
- [ ] Error handling graceful
- [ ] Visual hierarchy clear and intuitive

### ✅ **Technical Quality:**

- [ ] TypeScript compilation clean
- [ ] No console errors during operation
- [ ] Real Supabase data integration
- [ ] Proper authentication enforcement
- [ ] Database queries optimized

## Performance Benchmarks

### **Target Metrics:**

- **Initial Load:** < 2 seconds
- **Year Navigation:** < 500ms
- **Drill-Down:** < 300ms
- **Data Sync:** < 1 second
- **Mobile Performance:** 60fps interactions

### **Lighthouse Audit Goals:**

- **Performance:** 90+
- **Accessibility:** 100
- **Best Practices:** 95+
- **SEO:** 90+

## Deployment Notes

### **No New Environment Variables:**

All functionality uses existing Supabase configuration.

### **Database Requirements Met:**

- Uses existing assignment/deadline tables
- No schema migrations required
- Backward compatible with existing data

### **Netlify Configuration (No Changes):**

- Node 20 compatible
- Standard Next.js build process
- No additional build steps required

## Next Steps

After verifying Milestone 4:

1. **Test year navigation** across different academic years
2. **Verify drill-down logic** works correctly
3. **Check assignment integration** with real student data
4. **Proceed to Milestone 5** (Data Flows & Auth)
5. **Report any planner issues** for immediate resolution

---

**Milestone 4 Status:** ✅ COMPLETED - Year-at-a-Glance System Excellence  
**Next Milestone:** M5 - Data Flows & Auth  
**Planning Quality:** 📅 World-class academic year visualization and management
