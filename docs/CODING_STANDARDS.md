# Coding Standards & Error Prevention

## 1. Import Safety

**Rule:** When replacing code blocks using `replace_file_content`, ALWAYS ensure the `import` statements at the top of the file remain intact.

- **Risk:** Stripping imports causes a cascade of strict mode errors ("branding not found", types missing).
- **Prevention:** If modifying the top of a file, include the _existing_ imports in your `ReplacementContent` or use `multi_replace_file_content` to surgically edit lines _below_ the imports.

## 2. JSX Nesting Integrity

**Rule:** When removing a container `div` (e.g., `relative z-10`), YOU MUST remove its corresponding closing `</div>` tag.

- **Risk:** Orphaned closing tags cause the entire React tree to collapse, leading to "Expected corresponding JSX closing tag" errors that appear far away from the actual mistake.
- **Prevention:** Count opening and closing braces/tags in your `TargetContent` before applying edits.

## 3. Demo Component Props

**Rule:** Interactive components (like `DemoPlayer` or `DemoModal`) must handle `undefined` props if they are conditionally rendered or used in lists where data might be sparse.

- **Pattern:**

```tsx
if (!props.video) return null; // Add guard clause
```
