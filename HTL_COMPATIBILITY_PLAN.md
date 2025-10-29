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

#### 3. JavaScript Expression Evaluation with `utils:eval()` - ✅ IMPLEMENTED
Add JavaScript expression evaluation using `utils:eval()` syntax for complex logic and operations.

**Implementation Results:**
- ✅ Added `evaluate()` function directly in `src/expressions.js` (kept internal, no separate bundle needed)
- ✅ Modified `resolveExpression()` to detect and handle `utils:eval()` syntax
- ✅ Updated regex pattern in `resolveExpressions()` to support complex expressions (`/(\\)?\${([^}]+)}/gi`)
- ✅ Added 70 comprehensive tests covering:
  - Comparisons (`>`, `<`, `>=`, `<=`, `===`, `!==`)
  - Logical operators (`&&`, `||`, `!`)
  - Ternary operator
  - String methods (`.toUpperCase()`, `.toLowerCase()`, `.substring()`, `.trim()`, concatenation)
  - Array methods (`.join()`, `.map()`, `.filter()`, `.length`, index access)
  - Object access (nested properties, bracket notation, dynamic properties)
  - Arithmetic operations (`+`, `-`, `*`, `/`, `%`)
  - Global functions (`encodeURIComponent()`, `parseInt()`, `parseFloat()`)
  - Custom helper functions from context
  - Error handling (undefined variables, syntax errors)
  - Edge cases (empty expression, whitespace, null, undefined, booleans)
  - Real-world scenarios (admin checks, plural formatting, conditional CSS classes, status badges)
- ✅ Updated README with comprehensive documentation including:
  - Usage examples for all primary use cases
  - List of supported operators and methods
  - Custom helper function examples
  - **Prominent CAUTION warning** about eval and CSP requirements
  - Guidance on when to use `utils:eval()` vs context functions
- ✅ 165 tests passing (70 new tests added) with 100% coverage maintained
- ✅ Bundle size: 2804 bytes core (only 75 bytes increase!), 3450 bytes combined
- ✅ All constraints met: under 4KB core limit, under 6KB combined limit
- ✅ Lint passed, build passed

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

## Implementation Order

1. ✅ **Standardize expression syntax** (#1) - COMPLETED
2. **Add migration documentation** (#2) - Document completed features
3. ✅ **JavaScript expression evaluation with `utils:eval()`** (#3) - COMPLETED

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

