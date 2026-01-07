#!/usr/bin/env python3
import os
os.chdir(r"C:\Users\M Chandramohan\OneDrive\1MyDurhamLaw-4.0\mydurhamlaw-final")

# Fix index.tsx
with open("src/pages/index.tsx", 'r', encoding='utf-8') as f:
    index_content = f.read()
index_content = index_content.replace('href="/login"', 'href="/request-access"')
index_content = index_content.replace('href="/signup"', 'href="/request-access"')
with open("src/pages/index.tsx", 'w', encoding='utf-8') as f:
    f.write(index_content)
print("✓ Fixed index.tsx")

# Fix GlobalHeader.tsx
with open("src/components/GlobalHeader.tsx", 'r', encoding='utf-8') as f:
    header_content = f.read()
header_content = header_content.replace(
    '<Link href="/pricing" className="px-3 py-2 rounded-md text-sm font-semibold bg-white text-indigo-700 hover:bg-indigo-50 transition">',
    '<Link href="/request-access" className="px-3 py-2 rounded-md text-sm font-semibold bg-white text-indigo-700 hover:bg-indigo-50 transition">'
)
# Fix mobile version too
header_content = header_content.replace('href="/pricing"\n                        className="block px-4 py-2 text-sm text-indigo-700 bg-white', 'href="/request-access"\n                        className="block px-4 py-2 text-sm text-indigo-700 bg-white')
with open("src/components/GlobalHeader.tsx", 'w', encoding='utf-8') as f:
    f.write(header_content)
print("✓ Fixed GlobalHeader.tsx")

# Now commit
os.system('git add -A')
os.system('git commit -m "fix: All student login/trial buttons redirect to Durham email request"')
os.system('git push origin main')
print("✅ PUSHED TO MAIN")
