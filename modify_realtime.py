#!/usr/bin/env python3
"""
Modify useDurmahRealtime.ts to add function calling support
Adds: import, tools in session, and function call handler
"""

import sys

def modify_realtime_hook(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # 1. Add import after line 2
    if 'import { DURMAH_TOOLS }' not in ''.join(lines):
        lines.insert(2, 'import { DURMAH_TOOLS } from "@/lib/durmah/tools";\n')
        print("✓ Added DURMAH_TOOLS import")
    
    # 2. Add tools to session.update (around line 348-349)
    modified = False
    for i, line in enumerate(lines):
        if 'instructions: systemPrompt,' in line and not modified:
            # Check if next line is not already tools
            if i+1 < len(lines) and 'tools:' not in lines[i+1]:
                indent = len(line) - len(line.lstrip())
                lines.insert(i+1, ' ' * indent + 'tools: DURMAH_TOOLS,\n')
                print(f"✓ Added tools to session.update at line {i+1}")
                modified = True
                break
    
    # 3. Add function call handler in dc.onmessage (before the closing } of event handling)
    # Find the line with "// Log unhandled event types" (around line 504)
    for i, line in enumerate(lines):
        if '// Log unhandled event types' in line:
            # Insert function call handler before this comment
            handler_code = '''            // Function call handling
            else if (type === "response.function_call_arguments.done") {
              debugLog("[FUNCTION CALL]", payload.name, payload.arguments);
              handleFunctionCall(dc, payload).catch(err => {
                console.error("[FUNCTION CALL ERROR]", err);
              });
            }
            '''
            lines.insert(i, handler_code)
            print(f"✓ Added function call handler at line {i}")
            break
    
    # 4. Add handleFunctionCall helper function after mergeIncremental (around line 101)
    if 'async function handleFunctionCall' not in ''.join(lines):
        for i, line in enumerate(lines):
            if 'const appendAssistantText = useCallback' in line:
                # Insert helper function before this
                helper_code = '''
  // Handle function/tool calls from Realtime
  const handleFunctionCall = async (dc: RTCDataChannel, payload: any) => {
    const { call_id, name, arguments: argsStr } = payload;
    let args: any = {};
    
    try {
      args = JSON.parse(argsStr);
    } catch (e) {
      console.error("[FUNCTION CALL] Failed to parse args:", e);
      return;
    }

    console.log(`[FUNCTION CALL] ${name}`, args);
    
    let toolResult: any;
    try {
      if (name === "get_yaag_events") {
        const { startISO, endISO } = args;
        const res = await fetch(`/api/durmah/tools/yaag-events?startISO=${startISO}&endISO=${endISO}`);
        toolResult = await res.json();
      } else if (name === "get_news_headlines") {
        const params = new URLSearchParams();
        if (args.limit) params.set("limit", String(args.limit));
        if (args.topic) params.set("topic", args.topic);
        const res = await fetch(`/api/durmah/tools/news-headlines?${params}`);
        toolResult = await res.json();
      } else if (name === "get_assignment_details") {
        const res = await fetch(`/api/durmah/tools/assignment-by-id?id=${args.assignmentId}`);
        toolResult = await res.json();
      } else {
        toolResult = { error: "Unknown function: " + name };
      }
    } catch (error: any) {
      console.error(`[FUNCTION CALL] ${name} failed:`,error);
      toolResult = { error: error.message || "Tool execution failed" };
    }

    // Send tool result back
    dc.send(JSON.stringify({
      type: "conversation.item.create",
      item: {
        type: "function_call_output",
        call_id: call_id,
        output: JSON.stringify(toolResult)
      }
    }));

    // Trigger response generation
    dc.send(JSON.stringify({
      type: "response.create"
    }));
  };

'''
                lines.insert(i, helper_code)
                print(f"✓ Added handleFunctionCall helper at line {i}")
                break
    
    # Write back
    with open(filepath, 'w', encoding='utf-8') as f:
        f.writelines(lines)
    
    print(f"\n✅ Successfully modified {filepath}")

if __name__ == "__main__":
    filepath = sys.argv[1] if len(sys.argv) > 1 else "src/hooks/useDurmahRealtime.ts"
    modify_realtime_hook(filepath)
