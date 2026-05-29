# Security Policy

## Supported Versions

| Version | Supported |
|---------|----------|
| 1.x     | ✅        |

## Reporting a Vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.

Email: security@anahata.app

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (optional)

We will respond within 48 hours and aim to release a patch within 7 days for critical issues.

## Security Measures

- JWT tokens with 7-day expiry and auto-logout
- bcrypt password hashing (rounds: 12)
- Helmet.js HTTP security headers
- Rate limiting on all API routes (100 req/15min)
- Stricter rate limiting on auth routes (10 req/15min)
- CORS restricted to known origins in production
- Supabase Row Level Security (RLS) on all tables
- Input validation on all endpoints
- No secrets in repository (all via environment variables)
