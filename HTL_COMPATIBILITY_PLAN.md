# HTL/Sightly Compatibility Improvements Plan

This document outlines planned improvements to make Faintly easier to use for developers with HTL/Sightly background.

## Implementation Priority

### ✅ Completed

#### 1. Standardize Expression Syntax (Refined) - ✅ IMPLEMENTED
Make `${}` optional in `data-fly-*` directives for consistency with HTL.

**Current behavior:**
- `${}` required in text content and regular attributes (explicit evaluation)
- Bare expressions in `data-fly-*` directive values

**Proposed behavior:**
- **In `data-fly-*` directives**: Accept both `${expression}` and bare `expression`
- **In regular attributes and text**: Keep `${}` required (current behavior - efficient and explicit)

**Why this approach:**
- Avoids evaluating every attribute value (performance concern)
- No ambiguity - `${}` explicitly marks what should be evaluated
- Provides HTL-like feel where it matters (directives)
- Maintains backward compatibility

**Examples:**
```html
<!-- Both should work in directives -->
<div data-fly-test="user.isAdmin">
<div data-fly-test="${user.isAdmin}">

<!-- Regular attributes still require ${} (unchanged) -->
<a href="${link}">Link</a>
<div class="card-${index}">Content</div>

<!-- Text content still requires ${} (unchanged) -->
<p>Hello ${user.name}</p>
```

**Implementation notes:**
- Modify directive processing functions in `directives.js` to strip `${}` wrapper if present
- Only affects `data-fly-*` attribute value parsing
- Ensure backward compatibility with existing code
- Update tests to cover both syntaxes in directives
- Update README.md to document both syntaxes are supported in directives

**Implementation Results:**
- ✅ Added `unwrapExpression()` function in `src/expressions.js`
- ✅ Applied unwrapping to all directive processors: `processTest`, `processRepeat`, `processContent`, `processAttributes`, `resolveUnwrap`
- ✅ Added 13 comprehensive tests for `unwrapExpression()`
- ✅ Added 9 integration tests for `${}` syntax across all directive types
- ✅ Updated README Expressions section with clear documentation
- ✅ 117 tests passing with 100% coverage maintained
- ✅ Bundle size: 2729 bytes core (actually 1 byte smaller!)
- ✅ All directives now support both syntaxes: `data-fly-test="condition"` and `data-fly-test="${condition}"`
- ✅ Committed in commit `1a21b8f`

---

### 🚧 To Implement

#### 2. Add HTL Migration Documentation
Create a dedicated doc linked from README.md with side-by-side comparisons.

**Content to include:**
- Directive comparison table (HTL vs Faintly)
- Expression syntax differences
- Backend integration comparison (`data-sly-use` vs context object)
  - **Important**: Explain that `data-sly-use` is replaced by context functions
  - Show how Faintly's automatic function calling provides lazy/conditional loading
  - Example: `data-fly-content="fetchArticles"` automatically calls the function
- Context options (`@ context='uri'`) and why they're not needed in Faintly
  - HTL needs context-aware escaping because it generates HTML strings server-side
  - Faintly manipulates DOM directly - browser handles escaping automatically
  - Faintly's security module provides attribute/URL validation without needing context options
- Common patterns and their equivalents
- Migration examples from typical HTL components

**Example table:**
| HTL/Sightly | Faintly | Description |
|-------------|---------|-------------|
| `data-sly-test` | `data-fly-test` | Conditional rendering |
| `data-sly-list` | `data-fly-repeat` | Iteration |
| `data-sly-use` | context object | Backend integration |
| `data-sly-template` | `<template data-fly-name>` | Named templates |
| `data-sly-call` | `data-fly-include` | Template includes |
| `data-sly-unwrap` | `data-fly-unwrap` | Remove wrapper element |
| `data-sly-attribute` | `data-fly-attributes` | Set attributes dynamically |

---

### 🤔 Future Consideration

#### 3. JavaScript Expression Evaluation with `utils:eval()`
Add JavaScript expression evaluation using `utils:eval()` syntax for complex logic and operations.

**Two Primary Use Cases:**

1. **Comparisons** - For `data-fly-test` and `data-fly-not` directives
2. **Formatting** - For text content and attribute values

**Syntax Examples:**

```html
<!-- Comparisons in test directives -->
<div data-fly-test="utils:eval(count > 5)">More than 5</div>
<div data-fly-test="utils:eval(user.isAdmin || user.isModerator)">Admin or mod</div>
<div data-fly-test="utils:eval(isValid && isActive)">Valid and active</div>
<div data-fly-not="utils:eval(status === 'disabled')">Not disabled</div>
<div data-fly-test="utils:eval((count > 5 && !isDisabled) || isAdmin)">Complex logic</div>

<!-- Ternary operator -->
<div>${utils:eval(showCount ? count : 'N/A')}</div>
<div class="${utils:eval(isActive ? 'active' : 'inactive')}">Status</div>

<!-- String/array methods (native JavaScript) -->
<div>${utils:eval(items.join(', '))}</div>
<div>${utils:eval(user.name.toUpperCase())}</div>
<a href="${utils:eval(encodeURIComponent(userUrl))}">Link</a>
<p>${utils:eval('Hello ' + user.name)}</p>

<!-- Array/object access -->
<div>${utils:eval(items[0])}</div>
<div>${utils:eval(user.profile.name)}</div>
```

**Implementation Approach: JavaScript Evaluation with `new Function()`**

**Architecture:**
- Separate bundle: `dist/faintly.utils.js` (like security module)
- Dynamically imported on first `utils:eval()` usage
- Cached after first load (no reload on subsequent use)
- Uses `new Function()` to evaluate JavaScript expressions in context scope

**Expression Evaluation:**
```javascript
// In src/expressions.js - detect utils:eval(...)
if (expression.startsWith('utils:eval(') && expression.endsWith(')')) {
  if (!utilsModule) {
    utilsModule = await import('./faintly.utils.js');
  }
  const expr = expression.slice(11, -1); // Extract expression from utils:eval(...)
  return utilsModule.evaluate(expr, context);
}

// In src/faintly.utils.js
export function evaluate(expr, context) {
  const fn = new Function('ctx', `with(ctx) { return ${expr}; }`);
  return fn(context);
}
```

**Supports Full JavaScript Syntax:**
- **Comparisons**: `count > 5`, `status === 'active'`
- **Logical operators**: `isAdmin || isModerator`, `isValid && isActive`
- **Ternary**: `condition ? 'yes' : 'no'`
- **Method calls**: `items.join(', ')`, `name.toUpperCase()`
- **Array/object access**: `items[0]`, `user.profile.name`
- **Complex expressions**: `(count > 5 && !isDisabled) || isAdmin`

**Why this approach:**
- ✅ **Appropriately scary** - `eval` in the name warns developers about what's happening
- ✅ **Explicit and clear** - `utils:eval(expression)` is self-documenting
- ✅ Minimal bundle impact (~100-150 bytes)
- ✅ Full JavaScript expressiveness
- ✅ Simple implementation, easy to maintain
- ✅ Error handling - throws on invalid syntax
- ✅ Supports all use cases without parser limitations
- ✅ Future-proof - leaves room for `utils:safe()` or other utils later

**Security & CSP Considerations:**
- ⚠️ Uses `new Function()` which requires `unsafe-eval` CSP policy
- ⚠️ Context is fully trusted - expressions have access to entire context
- ⚠️ **Do not put untrusted user input in context** (already documented)
- ⚠️ Templates are authored by developers (not user-generated)
- ⚠️ If CSP blocks `unsafe-eval`, this feature cannot be used

**Trade-offs:**
- **Accepted**: CSP limitation, security responsibility on developer
- **Benefit**: 400-500 byte savings vs custom parser
- **Benefit**: No parser complexity or maintenance burden
- **Benefit**: Full JavaScript power without artificial limitations

**What You Can Use:**

Since expressions are evaluated as JavaScript, you have access to:

*Native JavaScript Operators:*
- Comparison: `>`, `<`, `>=`, `<=`, `===`, `!==`
- Logical: `&&`, `||`, `!`
- Ternary: `condition ? ifTrue : ifFalse`
- Arithmetic: `+`, `-`, `*`, `/`, `%`

*Native JavaScript Methods:*
- String: `.toUpperCase()`, `.toLowerCase()`, `.substring()`, `.trim()`, etc.
- Array: `.join()`, `.map()`, `.filter()`, `.length`, `[index]`, etc.
- Object: property access with `.` or `[]`
- Global: `encodeURIComponent()`, `encodeURI()`, `parseInt()`, etc.

*Optional Helper Functions:*
You can add custom helpers to the context if needed:
```javascript
await renderBlock(block, {
  items,
  formatMessage: (name, count) => `Hello ${name}, you have ${count} messages`,
  truncate: (str, len) => str.length > len ? str.slice(0, len) + '...' : str,
});
```
```html
<div>${utils:eval(formatMessage(user.name, messageCount))}</div>
<p>${utils:eval(truncate(longText, 100))}</p>
```

**Implementation Steps:**
1. Create `src/faintly.utils.js` with JavaScript evaluation function
2. Modify `src/expressions.js` to detect `utils:eval()` syntax and dynamic import
3. Add comprehensive tests for:
   - Comparisons, logical operators, ternary
   - String/array methods
   - Complex nested expressions
   - Error cases (syntax errors, undefined variables)
   - Context helper functions being called
4. Build separate `dist/faintly.utils.js` bundle
5. Document in README with:
   - Examples of common patterns with `utils:eval()`
   - **Prominent warning**: Uses `eval` - understand the implications
   - Security warnings (no untrusted input in context)
   - CSP requirements (`unsafe-eval` policy required)
   - When to use `utils:eval()` vs context functions
6. Ensure bundle stays under 150 bytes (gzipped)

**Error Handling:**
- Throws JavaScript syntax errors with stack trace
- Undefined variable errors bubble up naturally
- Consider wrapping errors with more context (which template/directive)

**Future Extensions:**
- Optional `utils:safe()` with custom parser if users need CSP compatibility
  - Example: `utils:safe(gt(count, 5))` - uses safe parser, no eval
  - Would be a larger bundle but CSP-compatible
- Additional built-in helper functions based on user feedback
- Allow passing custom helper functions via context `utils` property

---

## Implementation Order

1. ✅ **Standardize expression syntax** (#1) - COMPLETED
2. **Add migration documentation** (#2) - Document completed features

## Testing Strategy

- Maintain 100% code coverage
- Add tests for both old and new syntax (backward compatibility)
- Add integration tests showing HTL migration patterns
- Performance tests to ensure no regression

## Bundle Size Constraints

- Core bundle limit: 4KB / 4096 bytes (gzipped)
- Combined limit: 6KB / 6144 bytes (gzipped)
- Each feature must be evaluated for size impact
- May need to optimize existing code if approaching limits

---

## HTL/Sightly Comparison Summary

### Similarities
- HTML5 data attributes for directives
- Security-first approach with XSS protection
- Separation of concerns (logic vs markup)
- Expression-based templating
- Conditional rendering and iteration
- Template reuse and composition

### Key Differences
- **Execution context**: HTL is server-side (Java/Sling), Faintly is client-side (JavaScript)
- **Directive prefix**: `data-sly-*` vs `data-fly-*`
- **Backend integration**: HTL uses `data-sly-use`, Faintly uses context object
- **Iteration**: `data-sly-list` vs `data-fly-repeat`
- **Expression syntax**: HTL always uses `${}`, Faintly now supports both `${}` and bare expressions in directives

### Target Outcome
Make Faintly feel natural to HTL developers while maintaining its lightweight, client-side focus.

