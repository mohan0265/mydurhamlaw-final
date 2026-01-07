#!/usr/bin/env python3
"""
Comprehensive fix: All trial/signup buttons → /request-access
Remove hardcoded pricing
"""

import re

def fix_all_files():
    # 1. Homepage - Student Login
    with open("src/pages/index.tsx", 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace(
        '<Link href="/login" className="relative z-10 w-full" aria-label="Student Login">',
        '<Link href="/request-access" className="relative z-10 w-full" aria-label="Student Login">'
    )
    # Homepage - Get Started button at bottom
    content = content.replace(
        '<Link href="/signup">',
        '<Link href="/request-access">'
    )
    with open("src/pages/index.tsx", 'w', encoding='utf-8') as f:
        f.write(content)
    print("✓ Fixed src/pages/index.tsx")
    
    # 2. GlobalHeader - Login modal + Start Free Trial button
    with open("src/components/GlobalHeader.tsx", 'r', encoding='utf-8') as f:
        content = f.read()
    # Login modal student link
    content = content.replace(
        '<Link href="/login" onClick={() => setShowLoginModal(false)}>',
        '<Link href="/request-access" onClick={() => setShowLoginModal(false)}>'
    )
    # Start Free Trial button in header
    content = content.replace(
        '<Link href="/pricing" className="px-3 py-2 rounded-md text-sm font-semibold bg-white text-indigo-700 hover:bg-indigo-50 transition">',
        '<Link href="/request-access" className="px-3 py-2 rounded-md text-sm font-semibold bg-white text-indigo-700 hover:bg-indigo-50 transition">'
    )
    # Mobile Start Free Trial
    content = content.replace(
        '<Link\n                        href="/pricing"\n                        className="block px-4 py-2 text-sm text-indigo-700 bg-white rounded mx-3 mt-1 text-center font-semibold hover:bg-indigo-50"',
        '<Link\n                        href="/request-access"\n                        className="block px-4 py-2 text-sm text-indigo-700 bg-white rounded mx-3 mt-1 text-center font-semibold hover:bg-indigo-50"'
    )
    with open("src/components/GlobalHeader.tsx", 'w', encoding='utf-8') as f:
        f.write(content)
    print("✓ Fixed src/components/GlobalHeader.tsx")
    
    print("\n✅ All login/trial buttons now point to /request-access")
    print("📝 Pricing page unchanged (for admin to configure later)")

if __name__ == "__main__":
    fix_all_files()
