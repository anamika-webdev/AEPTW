const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { pool } = require('./database');

// Serialize user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user
passport.deserializeUser(async (id, done) => {
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    done(null, rows[0]);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy (if credentials are provided)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback'
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user exists
          const [users] = await pool.query(
            'SELECT * FROM users WHERE email = ?',
            [profile.emails[0].value]
          );

          if (users.length > 0) {
            // User exists, return user
            return done(null, users[0]);
          } else {
            // Create new user
            const [result] = await pool.query(
              'INSERT INTO users (login_id, full_name, email, role) VALUES (?, ?, ?, ?)',
              [
                profile.id,
                profile.displayName,
                profile.emails[0].value,
                'Requester' // Default role
              ]
            );

            const [newUser] = await pool.query(
              'SELECT * FROM users WHERE id = ?',
              [result.insertId]
            );

            return done(null, newUser[0]);
          }
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
} else {
  console.log('⚠️  Google OAuth not configured (GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET missing)');
}

module.exports = passport;