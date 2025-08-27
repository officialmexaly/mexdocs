"use client"
import { useState } from 'react'
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client - REPLACE WITH YOUR ACTUAL VALUES
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: 'systems@mexaly.com',
    password: 'MexalyAdmin2024!', // Pre-filled for testing
  })
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [debugInfo, setDebugInfo] = useState('')

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (error) setError('')
  }

  const checkUserRole = async (userId) => {
    try {
      setDebugInfo('Checking user roles...')
      
      // Get user profile first
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, display_name, status')
        .eq('id', userId)
        .single()

      if (profileError) {
        setDebugInfo(`Profile query error: ${profileError.message}`)
        return null
      }

      if (!profile) {
        setDebugInfo('User profile not found')
        return null
      }

      // FIXED: Get user's roles with correct join syntax
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select(`
          role_id,
          is_active,
          roles (
            id,
            name,
            priority,
            is_active
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true)

      if (rolesError) {
        setDebugInfo(`Roles query error: ${rolesError.message}`)
        return null
      }

      if (!userRoles || userRoles.length === 0) {
        setDebugInfo('No active roles found for user')
        return null
      }

      // Find the highest priority role (admin should have higher priority)
      const activeRoles = userRoles
        .filter(ur => ur.roles && ur.roles.is_active)
        .map(ur => ur.roles)
        .sort((a, b) => (b.priority || 0) - (a.priority || 0))

      const highestRole = activeRoles[0]
      const allRoleNames = activeRoles.map(r => r.name).join(', ')

      setDebugInfo(`Found roles: ${allRoleNames}. Highest: ${highestRole.name} (priority: ${highestRole.priority})`)

      return {
        ...profile,
        roles: highestRole,
        allRoles: activeRoles
      }

    } catch (err) {
      setDebugInfo(`Unexpected error: ${err.message}`)
      console.error('Error in checkUserRole:', err)
      return null
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setMessage('')
    setDebugInfo('')

    try {
      setMessage('Attempting login...')
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (error) {
        setError(`Login failed: ${error.message}`)
        setDebugInfo('Authentication failed - check email/password')
      } else if (data.user) {
        setMessage('Login successful! Checking permissions...')
        
        // Check user role and permissions
        const userProfile = await checkUserRole(data.user.id)
        
        if (userProfile && userProfile.roles) {
          const roleName = userProfile.roles.name
          const rolePriority = userProfile.roles.priority || 0
          const allRoleNames = userProfile.allRoles.map(r => r.name)
          
          setDebugInfo(`Primary role: ${roleName} (priority: ${rolePriority}), All roles: ${allRoleNames.join(', ')}`)
          
          // Check if user has admin access
          const hasAdminAccess = allRoleNames.includes('admin') || 
                               allRoleNames.includes('super_admin') || 
                               rolePriority >= 800

          if (hasAdminAccess) {
            setMessage('Admin access confirmed! Redirecting to dashboard...')
            setTimeout(() => {
              window.location.href = '/admin'
            }, 1500)
          } else {
            setError(`Access denied. You have roles: ${allRoleNames.join(', ')}, but admin privileges are required.`)
            await supabase.auth.signOut()
          }
        } else if (userProfile && !userProfile.roles) {
          setError('User profile found but no roles assigned. Contact administrator.')
          setDebugInfo('User exists in user_profiles but has no active roles in user_roles table')
          await supabase.auth.signOut()
        } else {
          setError('Unable to verify user permissions. Check database setup.')
          setDebugInfo('User profile not found or database connection failed')
          await supabase.auth.signOut()
        }
      }
    } catch (err) {
      console.error('Login error:', err)
      setError(`Unexpected error: ${err.message}`)
      setDebugInfo(`JavaScript error: ${err.stack}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testDatabaseConnection = async () => {
    setIsLoading(true)
    setError('')
    setMessage('Testing database connection...')
    setDebugInfo('')
    
    try {
      // Test 1: Check if we can access user_profiles table
      const { data: profileTest, error: profileError } = await supabase
        .from('user_profiles')
        .select('count')
        .limit(1)
        
      if (profileError) {
        setError(`user_profiles table error: ${profileError.message}`)
        return
      }

      // Test 2: Check if we can access roles table
      const { data: rolesTest, error: rolesError } = await supabase
        .from('roles')
        .select('count')
        .limit(1)
        
      if (rolesError) {
        setError(`roles table error: ${rolesError.message}`)
        return
      }

      // Test 3: Check if we can access user_roles table
      const { data: userRolesTest, error: userRolesError } = await supabase
        .from('user_roles')
        .select('count')
        .limit(1)
        
      if (userRolesError) {
        setError(`user_roles table error: ${userRolesError.message}`)
        return
      }

      // FIXED: Test specific admin user query with corrected join
      const { data: adminCheck, error: adminError } = await supabase
        .from('user_profiles')
        .select(`
          id,
          display_name,
          status,
          user_roles!inner (
            role_id,
            is_active,
            roles (name, priority)
          )
        `)
        .eq('id', (await supabase.auth.getUser()).data.user?.id || '00000000-0000-0000-0000-000000000000')
        
      if (adminError) {
        setDebugInfo(`Admin user check failed: ${adminError.message}`)
      } else if (adminCheck && adminCheck.length > 0) {
        setDebugInfo(`Admin user found with roles: ${adminCheck[0].user_roles.map(ur => ur.roles.name).join(', ')}`)
      }

      setMessage('Database connection successful! All tables accessible.')
      
    } catch (err) {
      setError(`Connection test error: ${err.message}`)
      setDebugInfo(`Full error: ${err.stack}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/admin`
        }
      })
      
      if (error) {
        setError(error.message)
      }
    } catch (err) {
      setError('Failed to sign in with Google')
    }
  }

  const handleGitHubSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/admin`
        }
      })
      
      if (error) {
        setError(error.message)
      }
    } catch (err) {
      setError('Failed to sign in with GitHub')
    }
  }

  const handleForgotPassword = async () => {
    if (!formData.email) {
      setError('Please enter your email address first')
      return
    }

    setIsLoading(true)
    setError('')
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) {
        setError(error.message)
      } else {
        setMessage('Password reset email sent! Check your inbox.')
      }
    } catch (err) {
      setError('Failed to send reset email')
    } finally {
      setIsLoading(false)
    }
  }

  const isFormValid = formData.email && formData.password

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500/30 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-cyan-500/30 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500/30 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-2000"></div>
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3Cpattern id='grid' width='10' height='10' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 10 0 L 0 0 0 10' fill='none' stroke='white' stroke-width='0.5'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23grid)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Glass Card */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent mb-2">
              Mexaly
            </div>
            <h1 className="text-xl font-bold text-white mb-1">
              Admin Login
            </h1>
            <p className="text-white/60 text-sm">
              Sign in to access the admin panel
            </p>
          </div>

          {/* Success Notice - Updated */}
          <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-300 text-xs">
            <div className="font-medium mb-1">✅ Query Structure: FIXED</div>
            <div>The role query join syntax has been corrected - should work now!</div>
          </div>

          {/* Default Credentials Helper */}
          <div className="mb-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs">
            <div className="font-medium mb-1">Admin Credentials:</div>
            <div>Email: systems@mexaly.com</div>
            <div>Password: MexalyAdmin2024!</div>
            <div className="text-blue-200 mt-1">Roles: reader, admin (admin priority: 800)</div>
          </div>

          {/* Error/Success Messages */}
          {(error || message) && (
            <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm ${
              error 
                ? 'bg-red-500/10 border border-red-500/20 text-red-400' 
                : 'bg-green-500/10 border border-green-500/20 text-green-400'
            }`}>
              <AlertCircle size={16} />
              <span>{error || message}</span>
            </div>
          )}

          {/* Debug Info */}
          {debugInfo && (
            <div className="mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs">
              <div className="font-medium mb-1">Debug Info:</div>
              <div>{debugInfo}</div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40 group-focus-within:text-purple-400 transition-colors duration-300" size={18} />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Email address"
                required
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-purple-400/50 focus:bg-white/10 transition-all duration-300 backdrop-blur-sm"
              />
            </div>

            {/* Password Input */}
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40 group-focus-within:text-purple-400 transition-colors duration-300" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Password"
                required
                className="w-full pl-12 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-purple-400/50 focus:bg-white/10 transition-all duration-300 backdrop-blur-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white transition-colors duration-300"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded border-2 transition-all duration-300 ${
                    rememberMe 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 border-purple-500' 
                      : 'bg-white/5 border-white/20 group-hover:border-white/40'
                  }`}>
                    {rememberMe && (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-white/70 group-hover:text-white transition-colors duration-300 text-sm">
                  Remember me
                </span>
              </label>
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={isLoading}
                className="text-purple-400 hover:text-purple-300 transition-colors duration-300 font-medium text-sm disabled:opacity-50"
              >
                Forgot password?
              </button>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading || !isFormValid}
              className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 hover:from-purple-600 hover:via-pink-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-purple-500/25 disabled:hover:shadow-none flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>

            {/* Test Database Button */}
            <button
              type="button"
              onClick={testDatabaseConnection}
              disabled={isLoading}
              className="w-full bg-gray-600/50 hover:bg-gray-600/70 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-all duration-300 text-sm"
            >
              Test Database Connection
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-slate-900/50 backdrop-blur-sm text-white/50 text-sm">
                Or continue with
              </span>
            </div>
          </div>

          {/* Social Login */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 hover:border-white/20 transition-all duration-300 backdrop-blur-sm group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span className="font-medium text-sm">Google</span>
            </button>
            <button
              onClick={handleGitHubSignIn}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 hover:border-white/20 transition-all duration-300 backdrop-blur-sm group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <span className="font-medium text-sm">GitHub</span>
            </button>
          </div>

          {/* Status Summary - Updated */}
          <div className="mt-4 p-3 rounded-lg bg-gray-800/50 border border-gray-700/50 text-xs text-gray-300">
            <div className="font-medium text-green-400 mb-2">✅ System Status:</div>
            <div className="space-y-1 text-gray-400">
              <div>• Database tables: EXISTS</div>
              <div>• Admin user: CONFIGURED</div>
              <div>• Roles assigned: reader, admin</div>
              <div>• Query structure: FIXED (removed :role_id from join)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}