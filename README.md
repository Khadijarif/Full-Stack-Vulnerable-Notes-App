# Full-Stack-Vulnerable-Notes-App

Short description A deliberately vulnerable, full‑stack notes application implemented for educational and security testing purposes. It demonstrates typical web application functionality (user auth, CRUD notes, admin views) and includes intentionally insecure code to teach common vulnerabilities such as SQL Injection (SQLi), Cross-Site Scripting (XSS), and Insecure Direct Object References (IDOR).

WARNING: This project is intentionally insecure. Do NOT deploy it on a public or production server. Use only in controlled, local, or lab environments.

Features / What this app does

User registration and login (session-based authentication)

Create, read, update, delete Notes (personal notes for users)

Public and private views: users can see their own notes; admin can see all notes

Basic HTML front-end pages: login, register, dashboard, create/edit note, admin view

A simple SQLite database (database.db) used for persistence

Minimal routing and server logic (Node.js / Express style — see server.js)

Intentional vulnerabilities (for learning & testing)

Below are the deliberate vulnerabilities included so you can practice detection, exploitation, and remediation. Each section explains how the vulnerability appears in the app, example exploitation notes, and suggested fixes.

1) SQL Injection (SQLi)

Where it appears: The app constructs SQL queries by concatenating user input (e.g., login username/password, note search, or note IDs) directly into SQL strings.

Why that’s bad: Unescaped input lets an attacker inject SQL fragments to read/modify/delete data or bypass authentication.

Example exploit idea: Login bypass via a payload such as username' OR '1'='1 or retrieving all users with '; SELECT * FROM users; -- (depending on how results are used).

Remediation:

Use parameterized queries / prepared statements (e.g., db.run("SELECT * FROM users WHERE email = ?", [email], ...)).

Validate and sanitize user inputs server‑side.

Use least-privileged DB accounts and avoid returning raw DB error messages to users.

2) Cross-Site Scripting (XSS)

Where it appears: User-supplied content (note title/body, profile fields) is rendered into HTML without proper escaping.

Why that’s bad: An attacker can store or reflect JavaScript into pages viewed by other users, steal cookies, perform actions on behalf of users, or deface pages.

Example exploit idea: Save a note with body <script>fetch('/steal?c='+document.cookie)</script>; when another user/admin views the note, the script runs.

Remediation:

Escape output when rendering user content in HTML (contextual escaping for HTML, attributes, JS, URLs).

Use templating libraries that auto-escape by default.

Implement Content Security Policy (CSP) headers to reduce impact of injected scripts.

3) Insecure Direct Object Reference (IDOR)

Where it appears: The app uses predictable or raw identifiers (e.g., numeric note IDs) in URLs or form parameters and trusts those IDs to authorize access (e.g., /note?id=123 with no owner check).

Why that’s bad: An authenticated attacker can manipulate IDs to view or modify other users’ notes (authorization bypass).

Example exploit idea: While logged in as user A, change ?id=45 to ?id=46 to access user B's note if no owner check exists.

Remediation:

Enforce server-side authorization checks: confirm that the logged-in user owns the resource before returning or modifying it.

Use non-guessable IDs (UUIDs, random tokens) and always still enforce authorization checks (IDs alone are not a security control).

Files of interest

server.js — main server and route handlers

database.db — SQLite DB file (sample/test data)

views/*.html — front-end pages (login, register, dashboard, admin, etc.)

public/* — CSS and static assets

.gitignore — files/directories excluded from Git (should include node_modules/, .env)

How to run (local, safe environment)

Clone the repo locally.

Install dependencies (do inside an isolated environment):

npm install

Ensure database.db is present (or run a provided script to create it if included).

Start server (development only):

node server.js

Open http://localhost:3000 (or the configured port) in your browser.

Always run this app in an isolated environment (VM, local machine, or container) and do not expose it to the public internet.

What to include in a professional README (recommended additions)

A professional README for a vulnerable testing project should include:

Project purpose & scope — why this exists (training, CTF, lab), intended audience, and safe usage instructions.

Security warning — explicit note that the app is intentionally insecure and must not be deployed publicly.

Features / functionality — what the app does (end-user perspective).

Architecture & stack — languages, frameworks, DB, ports, and key modules.

How to run / install — exact commands and environment requirements.

Testing & labs — suggested exercises, exploitation steps, and expected results (optionally in a separate LABS.md or EXERCISES.md).

Vulnerabilities explained — a clear section listing intentional vulnerabilities, how they manifest, exploitation examples, and remediation guidance (so readers learn best practices).

Contributing guidelines — how others can add tests, write fixes, or report issues.

License & contact — project license and maintainer contact info.

Changelog / versions — if the project will be maintained.

Suggested LABS.md exercises (short)

SQLi lab: Identify injectable endpoints; perform blind/union-based injection; extract usernames.

XSS lab: Identify stored vs reflected XSS sinks; craft payloads; implement CSP to defend.

IDOR lab: Locate object IDs in URLs; attempt horizontal/vertical privilege escalation; fix with owner checks.

Final notes (ethics & safety)

This repository is for authorized learning and testing only. Do not use the vulnerabilities here against systems for which you do not have explicit permission. Always follow ethical disclosure and legal guidelines when testing real-world applications.

This is the code of basic vulnerable functionalities and it is open for improvments!