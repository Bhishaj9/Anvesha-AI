# Security Policy

## Vulnerability Reporting
Please do not report security vulnerabilities through public GitHub issues. Instead, please report them directly to Gaurav via email. We will acknowledge receipt of your vulnerability report within 48 hours and strive to send you regular updates about our progress.

## Zero-Key Policy
Anvesha AI enforces a strict Zero-Key Policy. Never commit or hardcode Sarvam API keys or any other sensitive credentials into the repository. All sensitive configurations must be managed exclusively via environment variables (`.env` files) or secure secret managers (e.g., Hugging Face Spaces Secrets). Pull Requests containing exposed keys will be immediately closed and reported.

## Dependency Auditing
We are committed to maintaining a secure software supply chain. We utilize automated dependency management (Dependabot) to regularly audit and securely update our Node.js and Python dependencies. We welcome community audits of our open-source integration points.