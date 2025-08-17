# MyDurhamLaw - Milestone 3 Post-Apply Instructions

## Required Commands After Applying Patch

### 1. Install Dependencies
```bash
# Ensure Node 20 is active
nvm use 20

# Install any new dependencies
pnpm install
# or
npm install
```

### 2. Verify Environment Setup
```bash
# Ensure .env.local exists with all required variables
cp .env.example .env.local

# No new environment variables required for M3
# All functionality works with existing M1/M2 setup
```

### 3. Build Verification
```bash
# Type checking (should show no errors)
pnpm type-check

# Full build verification
pnpm build

# Start development server
pnpm dev
```

## Manual Verification Steps

### 🏠 **Global Header Testing**

#### **Header Appearance:**
- [ ] MyDurhamLaw logo/branding visible on all pages
- [ ] "Durham Law [DisplayName]" personalization works
- [ ] Consistent header design across homepage and app pages
- [ ] Header positioning: sticky top on all pages
- [ ] Z-index: Header stays above content when scrolling

#### **Navigation Items:**
- [ ] **Dashboard** → `/dashboard` (works for authenticated users)
- [ ] **My Year at a Glance** → `/planner/year-at-a-glance`
- [ ] **Premier Lounge** → `/lounge`
- [ ] **Movement Pillars** → `/movement-pillars` (**NEW**)
- [ ] **Vision 2035** → `/vision-2035` (**NEW**)
- [ ] **CSR Showcase** → `/csr-showcase` (**NEW**)

### 📱 **Responsive Design Testing**

#### **Desktop (> 768px):**
- [ ] Navigation centered horizontally
- [ ] All menu items visible inline
- [ ] Hover states work on navigation links
- [ ] Search bar integrated (if implemented)
- [ ] User info displayed in top-right

#### **Mobile (< 768px):**
- [ ] Hamburger menu button appears
- [ ] Accordion navigation opens/closes smoothly
- [ ] Touch targets are minimum 44px
- [ ] Navigation items stack vertically
- [ ] Mobile menu closes after navigation

#### **Tablet (768px - 1024px):**
- [ ] Responsive transition between mobile/desktop layouts
- [ ] Navigation remains functional at all sizes
- [ ] Content doesn't overflow or clip

### 🔗 **Link Functionality Testing**

#### **New Pages (Verify all load successfully):**

##### **Movement Pillars (`/movement-pillars`):**
- [ ] Page loads without errors
- [ ] Content displays properly
- [ ] Header navigation remains functional
- [ ] Responsive design works

##### **Vision 2035 (`/vision-2035`):**
- [ ] Page renders completely
- [ ] All content sections visible
- [ ] Links and interactions work
- [ ] Mobile layout appropriate

##### **CSR Showcase (`/csr-showcase`):**
- [ ] Page loads successfully
- [ ] Gallery/showcase content displays
- [ ] Interactive elements functional
- [ ] Performance acceptable

#### **Existing Pages (Verify still working):**
- [ ] **Homepage (`/`):** Header integration successful
- [ ] **Dashboard (`/dashboard`):** Navigation preserved
- [ ] **Planner (`/planner/year-at-a-glance`):** Functionality intact
- [ ] **Lounge (`/lounge`):** Community features working

### ⚙️ **Technical Verification**

#### **Build Quality:**
- [ ] `pnpm build` completes without errors
- [ ] No TypeScript compilation errors
- [ ] All pages generate successfully
- [ ] Bundle sizes reasonable

#### **Runtime Checks:**
- [ ] No console errors during navigation
- [ ] Smooth page transitions
- [ ] Header state persists across navigation
- [ ] Authentication state properly reflected

#### **Accessibility Testing:**
- [ ] **Keyboard Navigation:** Tab through all header elements
- [ ] **Screen Reader:** Header announces properly
- [ ] **Focus Management:** Visible focus indicators
- [ ] **Color Contrast:** Meets WCAG 2.1 AA standards

### 🔍 **Search Integration Testing**

#### **Search Bar (if visible):**
- [ ] Search input appears in header
- [ ] Placeholder text appropriate
- [ ] Search functionality works
- [ ] Results display correctly
- [ ] Mobile search experience

#### **Search Modal (if implemented):**
- [ ] Opens via keyboard shortcut or button
- [ ] Overlay displays properly
- [ ] Search results populate
- [ ] Closes via ESC or click outside

## Troubleshooting Guide

### **Common Issues & Solutions**

#### **"Header not appearing on some pages"**
- Check if page has custom layout overriding global header
- Verify `src/app/layout.tsx` or `src/pages/_app.tsx` includes Header component
- Check CSS z-index conflicts
- Verify no JavaScript errors preventing render

#### **"Navigation links broken"**
- Verify new page files exist in `src/pages/`
- Check for typos in route names
- Ensure Next.js development server restarted
- Check browser network tab for 404 errors

#### **"Mobile menu not working"**
- Verify JavaScript is enabled
- Check for console errors in mobile browser
- Test on actual mobile device, not just browser dev tools
- Ensure touch events are properly bound

#### **"Header styling issues"**
- Clear browser cache and hard refresh
- Check Tailwind CSS is loading properly
- Verify no CSS conflicts with existing styles
- Test in incognito/private browsing mode

### **Debug Commands**

#### **Development Debugging:**
```bash
# Clear Next.js cache
rm -rf .next
pnpm dev

# Check for unused CSS
npx tailwindcss -i ./src/styles/globals.css -o ./debug-output.css

# Analyze bundle
npx @next/bundle-analyzer
```

#### **Console Debugging:**
```javascript
// Check header component mounting
console.log('Header mounted:', document.querySelector('header'))

// Check navigation state
console.log('Current route:', window.location.pathname)

// Check responsive breakpoints
console.log('Screen width:', window.innerWidth)
```

## Performance Verification

### **Page Load Testing:**
- [ ] **Homepage:** < 2 seconds first load
- [ ] **Navigation:** < 500ms between pages
- [ ] **Header Render:** < 200ms header appearance
- [ ] **Mobile Menu:** < 300ms open/close animation

### **Lighthouse Audit (Recommended):**
```bash
# Install Lighthouse CLI
npm install -g lighthouse

# Audit homepage
lighthouse http://localhost:3000 --output html --output-path ./lighthouse-report.html

# Check specific metrics:
# - Performance: 90+
# - Accessibility: 100
# - Best Practices: 90+
# - SEO: 90+
```

## Deployment Verification

### **Netlify Build Settings (No Changes Required):**
- **Node Version:** 20.18.0+ (confirmed compatible)
- **Build Command:** `npm run build`
- **Publish Directory:** `.next`

### **Environment Variables (No New Variables):**
All functionality works with existing environment setup.

### **Production Testing:**
- [ ] Deploy to staging environment
- [ ] Test all navigation links in production
- [ ] Verify responsive design on real devices
- [ ] Check header performance under load

## Success Indicators

✅ **Visual Success:**
- Unified header design across all pages
- Responsive navigation works on all devices
- New pages load and display properly
- Brand consistency maintained

✅ **Functional Success:**
- All navigation links work correctly
- Mobile accordion functions smoothly
- Search integration operational
- Authentication state properly reflected

✅ **Technical Success:**
- Zero TypeScript compilation errors
- Clean build process
- No runtime JavaScript errors
- Optimal performance metrics

## Next Steps

After verifying Milestone 3:
1. **Test navigation thoroughly** across all devices
2. **Verify new pages** meet content requirements
3. **Proceed to Milestone 4** (Year-at-a-Glance & Planner Flow)
4. **Report any navigation issues** for immediate resolution

---

**Milestone 3 Status:** ✅ COMPLETED - Global Header & Navigation Excellence  
**Next Milestone:** M4 - Year-at-a-Glance & Planner Flow  
**Navigation Quality:** 🏠 World-class, unified experience across all pages  
