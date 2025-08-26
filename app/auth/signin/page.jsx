'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, Chrome, Github } from 'lucide-react';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [focusedField, setFocusedField] = useState('');
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (result.error) {
        setError(result.error.message);
      } else {
        router.push('/admin');
        router.refresh();
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error) {
      setError(error.message);
    }
  };

  const handleGitHubSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-900">
      {/* Background grid */}
      <div 
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage: `
            linear-gradient(rgba(148, 163, 184, 0.12) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148, 163, 184, 0.12) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
        }}
      />
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-gradient-to-r from-cyan-500/8 to-blue-500/8 rounded-full filter blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-gradient-to-r from-emerald-500/8 to-teal-500/8 rounded-full filter blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>
      
      <div className="relative flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
          <div 
            className="rounded-2xl p-6 shadow-2xl border backdrop-blur-xl relative overflow-hidden"
            style={{
              backgroundColor: 'rgba(30, 41, 59, 0.75)',
              borderColor: 'rgba(100, 116, 139, 0.2)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)',
            }}
          >
            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="text-xl font-bold text-white mb-1">
                Welcome Back
              </h1>
              <p className="text-slate-400 text-sm">
                Sign in to your account to continue
              </p>
            </div>

            <div className="space-y-4">
              {/* Email Field */}
              <div className="space-y-1">
                <label htmlFor="email" className="text-xs font-medium text-slate-300 block">
                  Email Address
                </label>
                <div className="relative">
                  <div className={`absolute inset-y-0 left-3 flex items-center pointer-events-none transition-colors duration-200 ${
                    focusedField === 'email' ? 'text-cyan-400' : 'text-slate-400'
                  }`}>
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-white placeholder-slate-400 focus:outline-none transition-all duration-200 border"
                    style={{
                      backgroundColor: focusedField === 'email' 
                        ? 'rgba(51, 65, 85, 0.9)' 
                        : 'rgba(51, 65, 85, 0.7)',
                      borderColor: focusedField === 'email' 
                        ? 'rgba(6, 182, 212, 0.5)' 
                        : 'rgba(71, 85, 105, 0.3)'
                    }}
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField('')}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1">
                <label htmlFor="password" className="text-xs font-medium text-slate-300 block">
                  Password
                </label>
                <div className="relative">
                  <div className={`absolute inset-y-0 left-3 flex items-center pointer-events-none transition-colors duration-200 ${
                    focusedField === 'password' ? 'text-cyan-400' : 'text-slate-400'
                  }`}>
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="w-full pl-10 pr-10 py-3 rounded-xl text-white placeholder-slate-400 focus:outline-none transition-all duration-200 border"
                    style={{
                      backgroundColor: focusedField === 'password' 
                        ? 'rgba(51, 65, 85, 0.9)' 
                        : 'rgba(51, 65, 85, 0.7)',
                      borderColor: focusedField === 'password' 
                        ? 'rgba(6, 182, 212, 0.5)' 
                        : 'rgba(71, 85, 105, 0.3)'
                    }}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField('')}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-cyan-400 transition-colors duration-200"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <div className={`w-4 h-4 rounded border-2 transition-all duration-200 ${
                      rememberMe 
                        ? 'bg-gradient-to-r from-purple-500 to-cyan-500 border-transparent shadow-lg' 
                        : 'bg-slate-700/50 border-slate-500 group-hover:border-slate-400'
                    }`}>
                      {rememberMe && (
                        <svg className="w-2.5 h-2.5 text-white absolute top-0.5 left-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="ml-2 text-xs text-slate-300 group-hover:text-slate-200 transition-colors">Remember me</span>
                </label>
                <button
                  type="button"
                  className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors duration-200 hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-xl border" 
                     style={{ 
                       backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                       borderColor: 'rgba(239, 68, 68, 0.3)'
                     }}>
                  <p className="text-red-300 text-xs font-medium">{error}</p>
                </div>
              )}

              {/* Sign In Button */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-3 px-6 font-semibold rounded-xl text-white focus:outline-none focus:ring-4 focus:ring-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 50%, #EC4899 100%)',
                  boxShadow: '0 10px 20px -5px rgba(139, 92, 246, 0.3)'
                }}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
                    Signing In...
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-600"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 text-slate-400 bg-slate-800">Or continue with</span>
                </div>
              </div>

              {/* Social Sign In Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="flex items-center justify-center px-3 py-2.5 border border-slate-600 rounded-xl text-slate-300 hover:text-white hover:border-slate-500 focus:outline-none focus:ring-4 focus:ring-slate-500/30 transition-all duration-200 hover:bg-slate-700/50"
                >
                  <Chrome className="w-4 h-4 mr-2" />
                  <span className="text-sm">Google</span>
                </button>
                
                <button
                  type="button"
                  onClick={handleGitHubSignIn}
                  className="flex items-center justify-center px-3 py-2.5 border border-slate-600 rounded-xl text-slate-300 hover:text-white hover:border-slate-500 focus:outline-none focus:ring-4 focus:ring-slate-500/30 transition-all duration-200 hover:bg-slate-700/50"
                >
                  <Github className="w-4 h-4 mr-2" />
                  <span className="text-sm">GitHub</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}