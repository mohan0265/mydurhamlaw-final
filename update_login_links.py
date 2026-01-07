#!/usr/bin/env python3
"""
Update student login links to point to /request-access instead of /login
"""

import sys

def update_homepage(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace student login link
    content = content.replace(
        '<Link href="/login" className="relative z-10 w-full" aria-label="Student Login">',
        '<Link href="/request-access" className="relative z-10 w-full" aria-label="Student Login">'
    )
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✓ Updated {filepath}")

def update_header(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace login modal student link
    content = content.replace(
        '<Link href="/login" onClick={() => setShowLoginModal(false)}>',
        '<Link href="/request-access" onClick={() => setShowLoginModal(false)}>'
    )
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✓ Updated {filepath}")

if __name__ == "__main__":
    update_homepage("src/pages/index.tsx")
    update_header("src/components/GlobalHeader.tsx")
    print("\n✅ All student login links now point to /request-access")
