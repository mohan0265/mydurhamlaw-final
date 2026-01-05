# Help & Support Widget - Knowledge Base

## Common Issues & Solutions

### Assignment Download Issues

#### Issue: "Download button doesn't work" or "File doesn't appear in Downloads folder"

**Quick Solution**: Use Microsoft Edge browser instead of Chrome.

**Why This Happens**:
Chrome has aggressive download security settings that may block programmatic file downloads from web applications. This is a browser security feature, not an issue with MyDurhamLaw.

**Step-by-Step Solutions**:

##### Option 1: Use a Different Browser (Recommended)
1. Open Microsoft Edge (pre-installed on Windows)
2. Go to mydurhamlaw.com
3. Navigate to your completed assignment
4. Click "Review & Download"
5. Click "Download Word Document (.docx)"
6. ✅ File will download to your Downloads folder

**Alternative Browsers**:
- Firefox
- Safari (Mac only)

##### Option 2: Fix Chrome Settings
1. Open Chrome
2. Click the three dots menu (⋮) in the top-right corner
3. Select **Settings**
4. Go to **Privacy and security**
5. Click **Site settings**
6. Scroll down to **Additional permissions**
7. Click **Automatic downloads**
8. Look for `mydurhamlaw.com` in the list
9. Change to **Allow**
10. Try downloading again

##### Option 3: Check Chrome Downloads
Sometimes Chrome downloads files but doesn't show a notification:
1. Type `chrome://downloads` in the address bar
2. Press Enter
3. Check if your file appears in the list
4. Click "Show in folder" to find where it was saved

---

### Verification Checklist

After downloading, verify your file:
- ✅ File appears in Downloads folder
- ✅ Filename includes module code (e.g., `LAW_1081_...`)
- ✅ File size is reasonable (typically 8-20 KB)
- ✅ File opens in Microsoft Word without errors
- ✅ Content matches the preview you saw

---

### Preview Modal Features

The assignment preview shows:
- **Title Page**: Module code, assignment title, word count, deadline
- **Essay Content**: Full formatted text in Times New Roman
- **AI Declaration**: Transparent record of AI assistance used
- **Download Button**: Generate .docx file for submission

**How to Use**:
1. Navigate to completed assignment in Assignment Hub
2. Click the green "Review & Download" button
3. **Review** your work carefully in the preview
4. Expand "Academic Integrity Declaration" to verify AI usage
5. Click "Download Word Document (.docx)" when satisfied
6. Open in Microsoft Word to finalize before submission

---

### Browser Compatibility

| Browser | Download Works |
|---------|----------------|
| Microsoft Edge | ✅ Yes |
| Firefox | ✅ Yes |
| Safari | ✅ Yes |
| Chrome | ⚠️ May require settings adjustment |

---

### Technical Details (For Advanced Users)

**Why Chrome Blocks Downloads**:
- Chrome's "Safe Browsing" feature blocks programmatic downloads to protect against malicious files
- University/corporate security policies may add additional restrictions
- Downloads generated via JavaScript (blob URLs) are often flagged

**What MyDurhamLaw Does**:
- Uses form POST submission with hidden iframe (proven 1990s technique)
- Server generates proper .docx format with correct headers
- No blob manipulation or popup windows
- Same method used by banks, e-commerce sites for receipts

**File Format**:
- Microsoft Word 2007+ (.docx format)
- Includes proper formatting: Times New Roman, justified alignment
- Contains title page, essay body, and AI declaration
- Fully editable in Microsoft Word

---

### Still Having Issues?

If download still doesn't work after trying the solutions above:

1. **Check Your Downloads Folder Location**:
   - Windows: `C:\Users\[YourName]\Downloads`
   - Mac: `~/Downloads`

2. **Check Disk Space**: Ensure you have at least 50 MB free

3. **Disable Browser Extensions**: Some ad blockers or privacy extensions block downloads

4. **Try Incognito/Private Mode**: This disables most extensions

5. **Contact Support**:
   - Use Durmah (voice assistant) - click the floating purple button
   - Email: support@mydurhamlaw.com
   - Include: Browser name, version, screenshot of error (if any)

---

## Related Features

- **Durmah Voice Assistant**: AI-powered help for legal questions
- **Always With You (AWY)**: Connect with family/mentors
- **Study Mode**: Deep legal reasoning and case analysis
- **Assignment Assistant**: Step-by-step guidance from brief to submission

---

## Quick Reference

**Can't download in Chrome?** → Switch to Edge  
**File seems small?** → Content is compressed, it will expand in Word  
**Need to edit?** → Open in Microsoft Word after downloading  
**Want to check before submitting?** → Use the preview modal  
**AI usage concerns?** → Check the AI Declaration section in preview
