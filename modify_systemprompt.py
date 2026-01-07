#!/usr/bin/env python3
"""
Add tool usage instructions to Durmah system prompt
"""

import sys

def modify_system_prompt(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find the buildDurmahSystemPrompt function and add TOOL USAGE section
    if 'TOOL USAGE' not in content:
        # Find the line "- Keep answers SHORT"
        replacement = '''TOOL USAGE (CRITICAL):
- When asked about schedule/calendar for ANY date → call get_yaag_events
- When asked "this week" or "next week" → calculate Mon-Sun dates and call get_yaag_events
- When asked about legal news or current cases → call get_news_headlines
- NEVER say "I can't access" - USE TOOLS FIRST
- If tool returns no results, THEN say "No events found"

DATE CALCULATION:
- "What's on Wed 28 Jan?" → get_yaag_events("2026-01-28", "2026-01-28")
- "What's next week?" → Calculate next Mon-Sun → get_yaag_events(nextMon, nextSun)
- "What's this week?" → Calculate current Mon-Sun → get_yaag_events(thisMon, thisSun)

VOICE MODE (P2 FIX #7 - Anti-Template Rules):'''
        
        content = content.replace(
            'VOICE MODE (P2 FIX #7 - Anti-Template Rules):',
            replacement
        )
        print("✓ Added TOOL USAGE section")
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"\n✅ Successfully modified {filepath}")

if __name__ == "__main__":
    filepath = sys.argv[1] if len(sys.argv) > 1 else "src/lib/durmah/systemPrompt.ts"
    modify_system_prompt(filepath)
