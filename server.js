const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const session = require('express-session');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

// Session middleware with weak configuration (VULNERABILITY 1)
app.use(session({
  secret: 'weaksecret', // Weak secret
  resave: true,
  saveUninitialized: true,
  cookie: { 
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: false // Not secure - allows XSS access
  }
}));

// Database setup
const db = new sqlite3.Database('database.db');

// Create tables if they don't exist
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    is_admin INTEGER DEFAULT 0
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    title TEXT,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);
  
  // Create admin user if not exists
  db.get("SELECT * FROM users WHERE username = 'admin'", (err, row) => {
    if (!row) {
      db.run("INSERT INTO users (username, password, is_admin) VALUES ('admin', 'admin5555', 1)");
    }
  });
});

// Serve HTML pages
app.get('/', (req, res) => {
  if (req.session.userId) {
    if (req.session.isAdmin) {
      res.sendFile(path.join(__dirname, 'views', 'admin.html'));
    } else {
      res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
    }
  } else {
    res.redirect('/login');
  }
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'register.html'));
});

app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error(err);
      return res.send('Error logging out');
    }
    res.sendFile(path.join(__dirname, 'views', 'logout.html'));
  });
});

// Admin dashboard
app.get('/admin', (req, res) => {
  if (!req.session.userId || !req.session.isAdmin) {
    return res.status(403).send('Access denied');
  }
  res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

// Authentication endpoints
app.post('/register', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.redirect('/register?error=Username and password required');
  }

  // Check if username exists
  db.get(`SELECT * FROM users WHERE username = '${username}'`, (err, row) => {
    if (row) {
      return res.redirect('/register?error=Username already exists');
    }

    // Vulnerable: plaintext password and SQL injection intentionally preserved
    db.run(`INSERT INTO users (username, password) VALUES ('${username}', '${password}')`, function(err) {
      if (err) {
        return res.redirect('/register?error=Registration failed');
      }
      res.redirect('/login?success=Registered successfully');
    });
  });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.redirect('/login?error=Enter username and password');
  }

  // Vulnerable SQL Injection intentionally preserved
  const sql = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
  db.get(sql, (err, user) => {
    if (!user) {
      return res.redirect('/login?error=Invalid credentials');
    }

    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.isAdmin = user.is_admin === 1;
    
    if (req.session.isAdmin) {
      res.redirect('/admin');
    } else {
      res.redirect('/');
    }
  });
});

// Get all users (admin only)
app.get('/admin/users', (req, res) => {
  if (!req.session.userId || !req.session.isAdmin) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  // VULNERABILITY: SQL Injection in admin panel
  db.all("SELECT id, username, password, is_admin, (SELECT COUNT(*) FROM notes WHERE user_id = users.id) as note_count FROM users", (err, users) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(users);
  });
});

// Add new user (admin only)
app.post('/admin/users', (req, res) => {
  if (!req.session.userId || !req.session.isAdmin) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  const { username, password, is_admin } = req.body;
  const isAdminFlag = is_admin === 'on' || is_admin === 'true' || is_admin === '1' ? 1 : 0;
  
  // VULNERABILITY: SQL Injection in admin panel
  db.run(`INSERT INTO users (username, password, is_admin) VALUES ('${username}', '${password}', ${isAdminFlag})`, function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ success: true });
  });
});

// Delete user (admin only)
app.delete('/admin/users/:id', (req, res) => {
  if (!req.session.userId || !req.session.isAdmin) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  const userId = req.params.id;
  
  // VULNERABILITY: SQL Injection + No authorization check beyond admin status
  db.run(`DELETE FROM users WHERE id = ${userId}`, function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    // Also delete user's notes
    db.run(`DELETE FROM notes WHERE user_id = ${userId}`);
    
    res.json({ success: true });
  });
});

// Update user (admin only)
app.put('/admin/users/:id', (req, res) => {
  if (!req.session.userId || !req.session.isAdmin) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  const userId = req.params.id;
  const { username, password, is_admin } = req.body;
  const isAdminFlag = is_admin === 'on' || is_admin === 'true' || is_admin === '1' ? 1 : 0;
  
  // VULNERABILITY: SQL Injection in admin panel
  db.run(`UPDATE users SET username = '${username}', password = '${password}', is_admin = ${isAdminFlag} WHERE id = ${userId}`, function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ success: true });
  });
});

// Notes endpoints
app.get('/notes', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).send('Unauthorized');
  }
  
  // VULNERABILITY 3 (again): SQL Injection in notes retrieval
  db.all(`SELECT * FROM notes WHERE user_id = ${req.session.userId}`, (err, notes) => {
    if (err) {
      return res.status(500).send('Server error');
    }
    res.json(notes);
  });
});

app.post('/notes', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).send('Unauthorized');
  }
  
  const { title, content } = req.body;
  
  // VULNERABILITY 3 (again): SQL Injection in note creation
  db.run(`INSERT INTO notes (user_id, title, content) VALUES (${req.session.userId}, '${title}', '${content}')`, function(err) {
    if (err) {
      return res.status(500).send('Server error');
    }
    res.sendStatus(200);
  });
});

app.put('/notes/:id', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).send('Unauthorized');
  }
  
  const { title, content } = req.body;
  const noteId = req.params.id;
  
  // VULNERABILITY 4: Insecure Direct Object Reference (IDOR) - no authorization check
  // Also SQL Injection vulnerability
  db.run(`UPDATE notes SET title = '${title}', content = '${content}' WHERE id = ${noteId}`, function(err) {
    if (err) {
      return res.status(500).send('Server error');
    }
    res.sendStatus(200);
  });
});

app.delete('/notes/:id', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).send('Unauthorized');
  }
  
  const noteId = req.params.id;
  
  // VULNERABILITY 4 (again): IDOR - no authorization check
  // Also SQL Injection vulnerability
  db.run(`DELETE FROM notes WHERE id = ${noteId}`, function(err) {
    if (err) {
      return res.status(500).send('Server error');
    }
    res.sendStatus(200);
  });
});

// VULNERABILITY 5: Reflected XSS example
app.get('/search', (req, res) => {
  const query = req.query.q;
  // Directly output user input without sanitization
  res.send(`<h1>Search Results for: ${query}</h1><p>No results found.</p>`);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Admin credentials: admin / admin5555');
});