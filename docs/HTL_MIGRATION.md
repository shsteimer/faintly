# Migrating from HTL/Sightly to Faintly

This guide helps developers familiar with Adobe Experience Manager's HTL (HTML Template Language, formerly Sightly) transition to using Faintly for client-side templating in AEM Edge Delivery Services.

## Table of Contents

- [Quick Reference](#quick-reference)
- [Overview](#overview)
- [Key Differences](#key-differences)
- [Expression Syntax](#expression-syntax)
- [Backend Integration](#backend-integration)
- [Context Options](#context-options)
- [Common Patterns](#common-patterns)

---

## Quick Reference

### Syntax Cheat Sheet

| Feature | HTL | Faintly |
|---------|-----|---------|
| **Text expression** | `${variable}` | `${variable}` |
| **Directive expression** | `${variable}` | `variable` or `${variable}` |
| **Comparison** | `${a > b}` (Java) | `utils:eval(a > b)` (JavaScript) |
| **Ternary** | `${condition ? 'yes' : 'no'}` | `${utils:eval(condition ? 'yes' : 'no')}` |
| **Logical NOT** | `${!condition}` | `data-fly-not="condition"` or `utils:eval(!condition)` |

### Directive Mapping

| HTL/Sightly | Faintly |
|-------------|---------|
| `data-sly-test` | `data-fly-test` |
| `data-sly-test` (negated) | `data-fly-not` |
| `data-sly-list` / `data-sly-repeat` | `data-fly-repeat` |
| `data-sly-use` | Functions in context object |
| `data-sly-text` | `data-fly-content` |
| `data-sly-attribute` | `data-fly-attributes` |
| `data-sly-unwrap` | `data-fly-unwrap` |
| `data-sly-template` | `<template data-fly-name>` |
| `data-sly-call` | `data-fly-include` |
| `data-sly-include` | `data-fly-include` |
| `<sly>` tag | Any element with `data-fly-unwrap` |
| `data-sly-element` | Not needed |
| `data-sly-resource` | Not applicable |

### Key Differences

1. ✅ **Directive prefix changes**: `data-sly-*` → `data-fly-*`
2. ✅ **`${}` optional in directives**: Both `data-fly-test="expr"` and `data-fly-test="${expr}"` work
3. ✅ **Inverse conditions made easy**: Use `data-fly-not="condition"` instead of negating with `!`
4. ✅ **Use `utils:eval()` for complex expressions**: Comparisons, ternary, logical operators
5. ✅ **Template logic via context**: Replace `data-sly-use` with JavaScript functions in context object
6. ✅ **Functions auto-called**: Faintly automatically calls functions in expressions for lazy/conditional loading
7. ✅ **No context options needed**: DOM manipulation handles escaping automatically
8. ✅ **Client-side execution**: Templates render in browser, not server

---

## Overview

### Similarities

Both HTL and Faintly share core philosophies:

- ✅ **HTML5 data attributes** for directives
- ✅ **Security-first** approach with XSS protection
- ✅ **Separation of concerns** (logic vs markup)
- ✅ **Expression-based** templating
- ✅ **Conditional rendering** and iteration
- ✅ **Template reuse** and composition

### Key Differences

| Aspect | HTL/Sightly | Faintly |
|--------|-------------|---------|
| **Execution** | Server-side (Java/Sling) | Client-side (JavaScript) |
| **Expression Context** | Server-side Java objects | Client-side JavaScript objects |
| **Dynamic Loading** | Server renders complete HTML | Client renders from templates |

---

## Expression Syntax

### HTL Expression Syntax

HTL always requires `${}` wrapper:

```html
<!-- HTL -->
<div data-sly-test="${user.isAdmin}">Admin Panel</div>
<p>${user.name}</p>
<a href="${user.profileUrl}">Profile</a>
```

### Faintly Expression Syntax

Faintly supports **two syntaxes** depending on context:

#### In Directives (Optional `${}`)

Both syntaxes work in `data-fly-*` directives:

```html
<!-- Both work in Faintly directives -->
<div data-fly-test="user.isAdmin">Admin Panel</div>
<div data-fly-test="${user.isAdmin}">Admin Panel</div>

<ul data-fly-repeat="items">
<ul data-fly-repeat="${items}">
```

#### In Text Content and Regular Attributes (Required `${}`)

```html
<!-- Faintly requires ${} in regular attributes and text -->
<p>Hello ${user.name}</p>
<a href="${user.profileUrl}">Profile</a>
<div class="card-${index}">Content</div>
```

### JavaScript Expressions with `utils:eval()`

Faintly supports complex JavaScript expressions using `utils:eval()`:

```html
<!-- HTL uses Java expressions -->
<div data-sly-test="${user.age >= 18}">Adult Content</div>

<!-- Faintly uses JavaScript expressions -->
<div data-fly-test="utils:eval(user.age >= 18)">Adult Content</div>
<p>Status: ${utils:eval(count === 1 ? 'item' : 'items')}</p>
<span class="${utils:eval(user.role === 'admin' ? 'badge-red' : 'badge-blue')}"></span>
```

**Supported operations:**
- Comparisons: `>`, `<`, `>=`, `<=`, `===`, `!==`
- Logical: `&&`, `||`, `!`
- Ternary: `condition ? true : false`
- Arithmetic: `+`, `-`, `*`, `/`, `%`
- String methods: `.toUpperCase()`, `.toLowerCase()`, `.substring()`, `.trim()`
- Array methods: `.join()`, `.map()`, `.filter()`, `.length`, index access
- Object access: nested properties, bracket notation

⚠️ **CAUTION**: `utils:eval()` uses JavaScript `eval()`. Only use with trusted data. Requires CSP to allow `'unsafe-eval'`. For untrusted data, use context functions instead.

---

## Backend Integration

### HTL: `data-sly-use`

In HTL, backend integration uses `data-sly-use` to load Java classes or Sling Models:

```html
<!-- HTL backend integration -->
<div data-sly-use.model="com.example.models.ArticleModel">
  <h1>${model.title}</h1>
  <p>${model.description}</p>
</div>

<!-- HTL with JavaScript use-API -->
<div data-sly-use.articles="articles.js">
  <ul data-sly-list="${articles.list}">
    <li>${item.title}</li>
  </ul>
</div>
```

### Faintly: Context Object

Faintly uses a JavaScript context object passed to `renderBlock()`:

```javascript
// Faintly backend integration
import { renderBlock } from './faintly.js';

// Context object with data and functions
const context = {
  title: 'Article Title',
  description: 'Article description',
  articles: fetchArticles(), // Can be sync data
  loadMore: () => fetchMoreArticles(), // Or async functions
};

const block = document.querySelector('.article-block');
renderBlock(block, context);
```

```html
<!-- Faintly template using context -->
<div class="article-block">
  <h1>${title}</h1>
  <p>${description}</p>
  
  <ul data-fly-repeat="articles">
    <li>${item.title}</li>
  </ul>
</div>
```

### Automatic Function Calling

Faintly automatically calls functions in expressions, enabling **lazy/conditional loading**:

```html
<!-- Function called only if condition is true -->
<div data-fly-test="user.isAdmin">
  <ul data-fly-repeat="fetchAdminData">
    <li>${item.name}</li>
  </ul>
</div>
```

```javascript
const context = {
  user: { isAdmin: true },
  // This function only executes if user.isAdmin is true
  fetchAdminData: () => fetch('/api/admin-data').then(r => r.json()),
};
```

### Migration Strategy

**HTL pattern:**
```html
<div data-sly-use.userService="com.example.UserService">
  <p>${userService.userName}</p>
</div>
```

**Faintly equivalent:**
```javascript
// In your block's JavaScript
import { renderBlock } from './faintly.js';

const context = {
  userName: getUserName(), // Direct function call
  // or
  user: { name: getUserName() },
};

renderBlock(block, context);
```

```html
<!-- In your block's HTML -->
<div class="user-block">
  <p>${userName}</p>
</div>
```

---

## Context Options

### HTL Context Options

HTL uses context options (`@ context`) for context-aware escaping:

```html
<!-- HTL context-aware escaping -->
<a href="${link.url @ context='uri'}">Link</a>
<div class="${cssClass @ context='styleToken'}">Content</div>
<script>var data = ${jsonData @ context='unsafe'};</script>
```

**Available contexts in HTL:**
- `text` (default) - Plain text
- `html` - HTML content
- `attribute` - HTML attribute
- `uri` - URL/URI
- `number` - Numeric value
- `elementName` - HTML element name
- `attributeName` - HTML attribute name
- `scriptToken` - JavaScript token
- `styleToken` - CSS token
- `unsafe` - No escaping (dangerous)

### Why Faintly Doesn't Need Context Options

Faintly doesn't require context options because:

1. **DOM Manipulation vs String Generation**
   - HTL generates HTML strings server-side → needs context-aware string escaping
   - Faintly manipulates DOM directly → browser handles escaping automatically

2. **Built-in Browser Security**
   - Setting `.textContent` automatically escapes HTML
   - Setting `.setAttribute()` handles attribute escaping
   - DOM APIs provide built-in XSS protection

3. **Security Module**
   - Faintly's security module validates attributes and URLs
   - Same-origin enforcement for URLs
   - Dangerous attribute blocking
   - No string-based escaping needed

### Migration Examples

**HTL:**
```html
<a href="${article.url @ context='uri'}" 
   title="${article.title @ context='attribute'}">
  ${article.name @ context='text'}
</a>
```

**Faintly (no context needed):**
```html
<a href="${article.url}" title="${article.title}">
  ${article.name}
</a>
```

The browser automatically handles proper escaping for each context (URL, attribute, text).

---

## Common Patterns

### Pattern 1: Conditional Rendering

**HTL:**
```html
<div data-sly-test="${user.isLoggedIn}">
  <p>Welcome, ${user.name}</p>
</div>
<div data-sly-test="${!user.isLoggedIn}">
  <p>Please log in</p>
</div>
```

**Faintly:**
```html
<div data-fly-test="user.isLoggedIn">
  <p>Welcome, ${user.name}</p>
</div>

<!-- Option 1: Using data-fly-not (cleaner) -->
<div data-fly-not="user.isLoggedIn">
  <p>Please log in</p>
</div>

<!-- Option 2: Using utils:eval for negation -->
<div data-fly-test="utils:eval(!user.isLoggedIn)">
  <p>Please log in</p>
</div>
```

### Pattern 2: List Iteration

**HTL:**
```html
<ul data-sly-list.article="${articles}">
  <li>
    <h3>${article.title}</h3>
    <p>${article.description}</p>
  </li>
</ul>
```

**Faintly:**
```html
<!-- Using default 'item' name -->
<ul data-fly-repeat="articles">
  <li>
    <h3>${item.title}</h3>
    <p>${item.description}</p>
  </li>
</ul>

<!-- Or using named repeat (closer to HTL) -->
<ul data-fly-repeat.article="articles">
  <li>
    <h3>${article.title}</h3>
    <p>${article.description}</p>
  </li>
</ul>
```

### Pattern 3: Conditional CSS Classes

**HTL:**
```html
<div class="card ${item.featured ? 'card--featured' : ''}">
  Content
</div>
```

**Faintly:**
```html
<div class="card ${utils:eval(item.featured ? 'card--featured' : '')}">
  Content
</div>

<!-- Or using data-fly-attributes -->
<div class="card" 
     data-fly-attributes="${utils:eval(item.featured ? {class: 'card card--featured'} : {})}">
  Content
</div>
```

### Pattern 4: Dynamic Attributes

**HTL:**
```html
<a data-sly-attribute.href="${link.url}" 
   data-sly-attribute.target="${link.external ? '_blank' : '_self'}">
  ${link.text}
</a>
```

**Faintly:**
```html
<a href="${link.url}" 
   target="${utils:eval(link.external ? '_blank' : '_self')}">
  ${link.text}
</a>

<!-- Or using data-fly-attributes for multiple attributes -->
<a data-fly-attributes="{href: link.url, target: link.target}">
  ${link.text}
</a>
```

### Pattern 5: Template Reuse

**HTL:**
```html
<!-- Define template -->
<template data-sly-template.card="${@ title, description}">
  <div class="card">
    <h3>${title}</h3>
    <p>${description}</p>
  </div>
</template>

<!-- Call template -->
<div data-sly-call="${card @ title=article.title, description=article.desc}"></div>
```

**Faintly:**
```html
<!-- Define template -->
<template data-fly-name="card">
  <div class="card">
    <h3>${title}</h3>
    <p>${description}</p>
  </div>
</template>

<!-- Include template -->
<div data-fly-include="card" data-fly-attributes="{title: article.title, description: article.desc}"></div>
```

### Pattern 6: Unwrap Utility Elements

**HTL:**
```html
<!-- Using sly tag (auto-unwraps) -->
<sly data-sly-test="${user.isAdmin}">
  <p>Admin content 1</p>
  <p>Admin content 2</p>
</sly>

<!-- Using unwrap directive -->
<div data-sly-unwrap="${true}">
  <p>This paragraph will remain</p>
</div>
```

**Faintly:**
```html
<!-- Any element with data-fly-unwrap -->
<div data-fly-test="user.isAdmin" data-fly-unwrap="true">
  <p>Admin content 1</p>
  <p>Admin content 2</p>
</div>

<!-- Or explicit unwrap -->
<div data-fly-unwrap="true">
  <p>This paragraph will remain</p>
</div>
```
