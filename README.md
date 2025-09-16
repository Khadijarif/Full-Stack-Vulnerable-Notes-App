# Full-Stack-Vulnerable-Notes-App

A deliberately vulnerable, full‑stack notes application implemented for educational and security testing purposes. It demonstrates typical web application functionality (user auth, CRUD notes, admin views) and includes intentionally insecure code to teach common vulnerabilities such as SQL Injection (SQLi), Cross-Site Scripting (XSS), and Insecure Direct Object References (IDOR).

**WARNING**: This project is intentionally insecure. Do NOT deploy it on a public or production server. Use only in controlled, local, or lab environments.

**Features**

User registration and login (session-based authentication)

Create, read, update, delete Notes (personal notes for users)

Public and private views: users can see their own notes; admin can see all notes

Basic HTML front-end pages: login, register, dashboard, create/edit note, admin view

A simple SQLite database (database.db) used for persistence

Minimal routing and server logic (Node.js / Express style — see server.js)

**Intentional vulnerabilities (for learning & testing)**

Below are the deliberate vulnerabilities included so you can practice detection, exploitation, and remediation. Each section explains how the vulnerability appears in the app, provides example exploitation notes, and suggests fixes.

**1) SQL Injection (SQLi)**

**Where it appears:** The app constructs SQL queries by concatenating user input (e.g., login username/password, note search, or note IDs) directly into SQL strings.

**Why that’s bad:** Unescaped input lets an attacker inject SQL fragments to read/modify/delete data or bypass authentication.

**Remediation:**

Use parameterized queries / prepared statements (e.g., db.run("SELECT * FROM users WHERE email = ?", [email], ...)).

Validate and sanitize user inputs server‑side.

Use least-privileged DB accounts and avoid returning raw DB error messages to users.

**2) Cross-Site Scripting (XSS)**

**Where it appears:** User-supplied content (note title/body, profile fields) is rendered into HTML without proper escaping.

**Why that’s bad:** An attacker can store or reflect JavaScript into pages viewed by other users, steal cookies, perform actions on behalf of users, or deface pages.

**Remediation:**

Escape output when rendering user content in HTML (contextual escaping for HTML, attributes, JS, URLs).

Use templating libraries that auto-escape by default.

Implement Content Security Policy (CSP) headers to reduce the impact of injected scripts.

**3) Insecure Direct Object Reference (IDOR)**

**Where it appears:** The app uses predictable or raw identifiers (e.g., numeric note IDs) in URLs or form parameters and trusts those IDs to authorize access (e.g., /note?id=123 with no owner check).

**Why that’s bad:** An authenticated attacker can manipulate IDs to view or modify other users’ notes (authorization bypass).

**Remediation:**

Enforce server-side authorization checks: confirm that the logged-in user owns the resource before returning or modifying it.

Use non-guessable IDs (UUIDs, random tokens) and always still enforce authorization checks (IDs alone are not a security control).

**Files of interest**

server.js — main server and route handlers

database.db — SQLite DB file (sample/test data)

views/*.html — front-end pages (login, register, dashboard, admin, etc.)

public/* — CSS and static assets

.gitignore — files/directories excluded from Git (should include node_modules/, .env)

**How to run (local, safe environment)**

Clone the repo locally.

Install dependencies (do inside an isolated environment):

npm install

Ensure database.db is present (or run a provided script to create it if included).

Start server (development only):

node server.js

Open http://localhost:3000 (or the configured port) in your browser.

Always run this app in an isolated environment (VM, local machine, or container) and do not expose it to the public internet.


**Final notes (ethics & safety)**

This repository is for authorized learning and testing only. Do not use the vulnerabilities here against systems for which you do not have explicit permission. Always follow ethical disclosure and legal guidelines when testing real-world applications.

**This is the code for basic vulnerable functionalities, and it is open for improvements!**
