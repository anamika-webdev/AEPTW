// backend/src/config/passport.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { pool } = require('./database');

// Configure Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
    passReqToCallback: true
  },
  async (req, accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails[0].value;
      const googleId = profile.id;
      const fullName = profile.displayName;
      const profilePicture = profile.photos && profile.photos[0] ? profile.photos[0].value : null;

      console.log('Google OAuth attempt:', { email, googleId, fullName });

      // Check if user exists with this Google ID
      let [users] = await pool.query(
        'SELECT * FROM users WHERE google_id = ?',
        [googleId]
      );

      if (users.length > 0) {
        // User exists with Google ID - update refresh token
        const user = users[0];
        
        await pool.query(
          'UPDATE users SET refresh_token = ?, updated_at = NOW() WHERE id = ?',
          [refreshToken, user.id]
        );

        console.log('Existing Google user logged in:', email);
        return done(null, user);
      }

      // Check if user exists with this email (local account)
      [users] = await pool.query(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );

      if (users.length > 0) {
        // Link existing local account to Google
        const user = users[0];
        
        await pool.query(
          'UPDATE users SET google_id = ?, refresh_token = ?, auth_provider = ?, updated_at = NOW() WHERE id = ?',
          [googleId, refreshToken, 'google', user.id]
        );

        console.log('Linked existing account to Google:', email);
        return done(null, user);
      }

      // Create new user account from Google
      // Default role for new Google sign-ups
      const defaultRole = process.env.DEFAULT_GOOGLE_ROLE || 'Requester';
      
      const [result] = await pool.query(
        `INSERT INTO users (
          login_id, full_name, email, google_id, refresh_token, 
          auth_provider, role, created_at
        ) VALUES (?, ?, ?, ?, ?, 'google', ?, NOW())`,
        [
          email.split('@')[0], // Use email prefix as login_id
          fullName,
          email,
          googleId,
          refreshToken,
          defaultRole
        ]
      );

      const newUser = {
        id: result.insertId,
        login_id: email.split('@')[0],
        full_name: fullName,
        email: email,
        role: defaultRole,
        google_id: googleId,
        auth_provider: 'google'
      };

      console.log('New Google user created:', email);
      return done(null, newUser);

    } catch (error) {
      console.error('Google OAuth error:', error);
      return done(error, null);
    }
  }
));

// Serialize user (not used with JWT, but required by passport)
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user (not used with JWT, but required by passport)
passport.deserializeUser(async (id, done) => {
  try {
    const [users] = await pool.query(
      'SELECT id, login_id, full_name, email, role, auth_provider FROM users WHERE id = ?',
      [id]
    );
    
    if (users.length > 0) {
      done(null, users[0]);
    } else {
      done(new Error('User not found'), null);
    }
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;