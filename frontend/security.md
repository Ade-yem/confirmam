# Frontend Security Requirements

## Purpose

This document defines the mandatory security requirements for the
frontend. Every implementation must comply with these requirements where necessary.

## Security Principles

-   Treat all client-side data as untrusted.
-   Security must not rely on obscurity.
-   Prefer secure defaults over convenience.
-   Follow the principle of least privilege.
-   Client-side validation improves UX only; the backend is the source
    of truth.

## Input Handling

-   Validate all user input for usability.
-   Sanitize or safely render untrusted content.
-   Prevent Cross-Site Scripting (XSS), including reflected, stored, and
    DOM-based XSS.
-   Avoid dangerous APIs such as `eval()` and similar dynamic code
    execution.
-   Avoid unsafe HTML rendering unless sanitized.

## Authentication & Sessions

-   Never embed secrets in frontend code.
-   Prefer HttpOnly, Secure cookies for authentication where supported.
-   Never expose refresh tokens to JavaScript.
-   Handle expired sessions gracefully.

## Authorization

-   Never rely on hidden UI elements for authorization.
-   Assume every API can be called outside the application.
-   Do not expose privileged functionality without server-side
    authorization.

## API Communication

-   Always use HTTPS in production.
-   Handle malformed or unexpected API responses safely.
-   Do not expose sensitive information in client-side errors or logs.
-   Do not trust client-controlled identifiers or values.

## Storage

-   Avoid storing sensitive data in localStorage or sessionStorage.
-   Store only what is necessary.
-   Clear temporary data when it is no longer needed.

## File Uploads

-   Validate file type, size, and format before upload.
-   Treat uploaded content as untrusted.
-   Avoid rendering uploaded HTML or SVG without sanitization.

## Browser Security

-   Design for compatibility with Content Security Policy (CSP).
-   Support protections against clickjacking.
-   Use safe link handling (`rel="noopener noreferrer"` where
    appropriate).
-   Avoid mixed HTTP/HTTPS content.

## Dependencies

-   Use maintained, reputable packages.
-   Minimize third-party dependencies.
-   Remove unused dependencies.
-   Regularly audit for known vulnerabilities.

## Privacy

-   Collect only data required for functionality.
-   Avoid unnecessary browser permissions.
-   Do not log personal or sensitive information.

## Error Handling

-   Display user-friendly error messages.
-   Never expose stack traces, internal endpoints, secrets, or
    implementation details.

## Performance & Availability

-   Prevent accidental denial-of-service through inefficient rendering.
-   Lazy-load large modules when appropriate.
-   Debounce or throttle high-frequency client actions where
    appropriate.

## Accessibility

-   Security controls must not unnecessarily reduce accessibility.
-   Confirm destructive actions clearly.

## Prohibited Practices

-   No hardcoded secrets.
-   No unsafe dynamic code execution.
-   No client-side-only authorization.
-   No trust in hidden form fields.
-   No debug information in production builds.
-   No production source maps unless explicitly approved.

## Developer Checklist

Before completing any feature, verify: - \[ \] No obvious XSS vectors. -
\[ \] No unsafe rendering of user-controlled content. - \[ \] No
sensitive data exposed. - \[ \] Authentication handled securely. - \[ \]
Authorization not enforced only on the client. - \[ \] Secure API
interactions. - \[ \] No unnecessary dependencies introduced. - \[ \]
Production logging reviewed. - \[ \] Code aligns with this document.

## AI Agent Instructions

Before implementing any feature: 1. Read this document. 2. Follow these
requirements throughout implementation. 3. Choose industry-standard
mitigations appropriate for the project's framework. 4. If a requested
feature conflicts with these requirements, stop and explain the
conflict. 5. Before marking a task complete, perform a security
self-review against this document and the OWASP Top 10, documenting any
assumptions or residual risks.
