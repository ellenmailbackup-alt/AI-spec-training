// Supabase Auth integration for server-side
import { createClient } from '@supabase/supabase-js';
import type { Express, RequestHandler } from 'express';
import { storage } from './storage';
import { logSecurityEvent } from './security';

if (!process.env.SUPABASE_URL) {
  throw new Error('SUPABASE_URL must be set');
}

if (!process.env.SUPABASE_ANON_KEY) {
  throw new Error('SUPABASE_ANON_KEY must be set');
}

// Create Supabase client for server-side auth operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  }
);

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
        role?: string;
      };
    }
  }
}

// --- HELPER: COOKIE OPTIONS ---
// We centralize cookie options to ensure they are always correct for production
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,      // 👈 CRITICAL: Must be true for HTTPS
  sameSite: 'none' as const, // 👈 CRITICAL: Allows Vercel -> Cloud Run
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export async function setupAuth(app: Express) {
  
  // 1. TRUST PROXY (Required for Cloud Run to see HTTPS)
  app.set("trust proxy", 1);

  // Auth routes

  // Sign up with email/password
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password required' });
      }

      // Create auth user in Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });

      if (error) {
        logSecurityEvent('Signup failed', req, { error: error.message });
        return res.status(400).json({ message: error.message });
      }

      if (!data.user) {
        return res.status(400).json({ message: 'Failed to create user' });
      }

      // Create user in our database
      await storage.upsertUser({
        id: data.user.id,
        email: data.user.email!,
        firstName: firstName || null,
        lastName: lastName || null,
        profileImageUrl: null,
        role: 'customer', // Default role
      });

      res.json({
        message: 'User created successfully. Please check your email to verify your account.',
        user: data.user,
      });
    } catch (error: any) {
      console.error('Signup error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Sign in with email/password
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password required' });
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        logSecurityEvent('Login failed', req, { error: error.message });
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      if (!data.session) {
        return res.status(401).json({ message: 'Failed to create session' });
      }

      // Get or create user in our database
      let user = await storage.getUser(data.user.id);
      if (!user) {
        await storage.upsertUser({
          id: data.user.id,
          email: data.user.email!,
          firstName: data.user.user_metadata?.first_name || null,
          lastName: data.user.user_metadata?.last_name || null,
          profileImageUrl: null,
          role: 'customer',
        });
        user = await storage.getUser(data.user.id);
      }

      // Set secure cookies with CORRECT options
      res.cookie('sb-access-token', data.session.access_token, COOKIE_OPTIONS);
      res.cookie('sb-refresh-token', data.session.refresh_token, COOKIE_OPTIONS);

      res.json({
        message: 'Login successful',
        user: {
          id: user!.id,
          email: user!.email,
          role: user!.role,
          firstName: user!.firstName,
          lastName: user!.lastName,
        },
        redirectUrl: user!.role === 'admin' ? '/admin' : '/shop',
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Logout
  app.post('/api/auth/logout', async (req, res) => {
    try {
      const token = req.cookies['sb-access-token'];

      if (token) {
        await supabase.auth.signOut();
      }

      res.clearCookie('sb-access-token', COOKIE_OPTIONS);
      res.clearCookie('sb-refresh-token', COOKIE_OPTIONS);

      res.json({ message: 'Logged out successfully' });
    } catch (error: any) {
      console.error('Logout error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Request password reset
  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }

      // Construct the redirect URL for the reset password page
      const redirectTo = `${req.protocol}://${req.hostname}/reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) {
        console.error('Password reset error:', error);
        // Don't reveal if email exists or not for security
        return res.json({ message: 'If an account exists, a reset link has been sent.' });
      }

      res.json({ message: 'Password reset email sent successfully' });
    } catch (error: any) {
      console.error('Password reset error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Update password with reset token
  app.post('/api/auth/update-password', async (req, res) => {
    try {
      const { password, accessToken, refreshToken } = req.body;

      if (!password || !accessToken) {
        return res.status(400).json({ message: 'Password and access token are required' });
      }

      // Create a temporary Supabase client for this operation
      const supabaseClient = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_ANON_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );

      // Set the session using the recovery tokens
      const { error: sessionError } = await supabaseClient.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || accessToken, // Use access token as fallback
      });

      if (sessionError) {
        console.error('Session error:', sessionError);
        return res.status(401).json({ message: 'Invalid or expired reset token' });
      }

      // Now update the password
      const { error: updateError } = await supabaseClient.auth.updateUser({
        password,
      });

      if (updateError) {
        console.error('Password update error:', updateError);
        return res.status(400).json({ message: updateError.message });
      }

      res.json({ message: 'Password updated successfully' });
    } catch (error: any) {
      console.error('Password update error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // OAuth providers (Google, GitHub, etc.)
  app.post('/api/auth/oauth/:provider', async (req, res) => {
    try {
      const provider = req.params.provider as 'google' | 'github' | 'facebook';
      const redirectTo = `${req.protocol}://${req.hostname}/api/auth/callback`;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
        },
      });

      if (error) {
        return res.status(400).json({ message: error.message });
      }

      res.json({ url: data.url });
    } catch (error: any) {
      console.error('OAuth error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // OAuth callback
  app.get('/api/auth/callback', async (req, res) => {
    try {
      const code = req.query.code as string;

      if (!code) {
        return res.redirect('/shop?error=no_code');
      }

      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error || !data.session) {
        return res.redirect('/shop?error=auth_failed');
      }

      // Get or create user in our database
      let user = await storage.getUser(data.user.id);
      if (!user) {
        await storage.upsertUser({
          id: data.user.id,
          email: data.user.email!,
          firstName: data.user.user_metadata?.first_name || data.user.user_metadata?.name || null,
          lastName: data.user.user_metadata?.last_name || null,
          profileImageUrl: data.user.user_metadata?.avatar_url || null,
          role: 'customer',
        });
        user = await storage.getUser(data.user.id);
      }

      // Set cookies with CORRECT options
      res.cookie('sb-access-token', data.session.access_token, COOKIE_OPTIONS);
      res.cookie('sb-refresh-token', data.session.refresh_token, COOKIE_OPTIONS);

      // Redirect based on role
      const redirectUrl = user!.role === 'admin' ? '/admin' : '/shop';
      res.redirect(redirectUrl);
    } catch (error: any) {
      console.error('Callback error:', error);
      res.redirect('/shop?error=callback_failed');
    }
  });
}

// Middleware to check if user is authenticated
export const isAuthenticated: RequestHandler = async (req, res, next) => {
  try {
    const token = req.cookies['sb-access-token'];
    const refreshToken = req.cookies['sb-refresh-token'];

    if (!token) {
      // Don't log this as a security event for every request, just return 401
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Verify token with Supabase
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      // Try to refresh the session
      if (refreshToken) {
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession({
          refresh_token: refreshToken,
        });

        if (refreshError || !refreshData.session) {
          res.clearCookie('sb-access-token', COOKIE_OPTIONS);
          res.clearCookie('sb-refresh-token', COOKIE_OPTIONS);
          return res.status(401).json({ message: 'Unauthorized' });
        }

        // Update cookies with new tokens
        res.cookie('sb-access-token', refreshData.session.access_token, COOKIE_OPTIONS);
        res.cookie('sb-refresh-token', refreshData.session.refresh_token, COOKIE_OPTIONS);

        // Get user from database
        const user = await storage.getUser(refreshData.user.id);
        req.user = {
          id: refreshData.user.id,
          email: refreshData.user.email,
          role: user?.role,
        };

        return next();
      }

      res.clearCookie('sb-access-token', COOKIE_OPTIONS);
      res.clearCookie('sb-refresh-token', COOKIE_OPTIONS);
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Get user from database
    const user = await storage.getUser(data.user.id);
    req.user = {
      id: data.user.id,
      email: data.user.email,
      role: user?.role,
    };

    next();
  } catch (error: any) {
    console.error('Authentication error:', error);
    res.status(401).json({ message: 'Unauthorized' });
  }
};

// Middleware to check if user is admin (also authenticates the user first)
export const isAdmin: RequestHandler = async (req, res, next) => {
  try {
    // Reuse isAuthenticated logic or copy-paste (omitted for brevity, but use the same logic as above)
    // The key is ensuring COOKIE_OPTIONS are used whenever setting/clearing cookies.
    
    // ... (Your existing admin logic is fine, just make sure to use COOKIE_OPTIONS if you set cookies) ...
    
    // For now, let's just reuse the logic from your file but assume you update the cookie parts:
    
    const token = req.cookies['sb-access-token'];
    const refreshToken = req.cookies['sb-refresh-token'];

    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
        // Refresh logic...
         if (refreshToken) {
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
            if (refreshError || !refreshData.session) return res.status(401).json({ message: 'Unauthorized' });
            
            res.cookie('sb-access-token', refreshData.session.access_token, COOKIE_OPTIONS);
            res.cookie('sb-refresh-token', refreshData.session.refresh_token, COOKIE_OPTIONS);
            
            const user = await storage.getUser(refreshData.user.id);
            if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
            
            req.user = { id: refreshData.user.id, email: refreshData.user.email, role: user.role };
            return next();
         }
         return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await storage.getUser(data.user.id);
    if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

    req.user = { id: data.user.id, email: data.user.email, role: user.role };
    next();

  } catch (error: any) {
    console.error('Admin check error:', error);
    res.status(500).json({ message: 'Failed to verify admin status' });
  }
};
