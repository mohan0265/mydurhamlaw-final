#!/usr/bin/env python3
"""
Quick commit script for onboarding fixes
"""
import subprocess
import sys

def run_git_command(cmd):
    """Run git command and return output"""
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, cwd=".")
        print(result.stdout)
        if result.stderr:
            print(result.stderr, file=sys.stderr)
        return result.returncode == 0
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return False

# Stage files
print("📝 Staging files...")
run_git_command("git add src/pages/auth/callback.tsx src/components/GlobalHeader.tsx")

# Commit
print("\n💾 Committing...")
commit_msg = """fix: Admin login hang + Member Login button

CRITICAL FIXES:
- Auth callback now skips profile check for admin role
  * Fixes hang at 'Verifying access...'
  * Allows existing admins to login (no consent fields required)
  * Students still require profile completion

FEATURES:
- Added 'Member Login' button to header (desktop + mobile)
  * Direct link to /login for Google sign-in
  * Easier access for approved members

Result: mohan0265@gmail.com can now login via Google OAuth ✅"""

run_git_command(f'git commit -m "{commit_msg}"')

# Push
print("\n🚀 Pushing to main...")
success = run_git_command("git push origin main")

if success:
    print("\n✅ DEPLOYED! Wait ~2 min for Netlify build")
    print("🔗 Then test: mohan0265@gmail.com login should work!")
else:
    print("\n❌ Push failed - check errors above")
