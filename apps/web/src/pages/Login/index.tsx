import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { loginWithEmail, loginWithGoogle, registerBusiness } from '@/services/api'
import { sanitiseEmail, sanitiseText } from '@/utils/sanitise'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import { cn } from '@/utils/cn'

type Mode = 'login' | 'register'

export default function LoginScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, login } = useAuthStore()

  // Card view mode
  const [mode, setMode] = useState<Mode>('login')

  // Controlled input states (unsanitised at typing)
  const [businessName, setBusinessName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  // Visibility toggles
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  // Interaction states
  const [isLoading, setIsLoading] = useState(false)
  
  // Validation errors (triggered on submit)
  const [businessNameError, setBusinessNameError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null)
  const [generalError, setGeneralError] = useState<string | null>(null)

  // Redirect if already authenticated
  const from = location.state?.from?.pathname || '/'
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, from])

  // Clear errors and input fields when changing modes
  const handleToggleMode = (targetMode: Mode) => {
    setMode(targetMode)
    setBusinessNameError(null)
    setEmailError(null)
    setPasswordError(null)
    setConfirmPasswordError(null)
    setGeneralError(null)
    setBusinessName('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setShowPassword(false)
    setShowConfirmPassword(false)
  }

  const validateEmail = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Clear previous errors
    setBusinessNameError(null)
    setEmailError(null)
    setPasswordError(null)
    setConfirmPasswordError(null)
    setGeneralError(null)

    // 1. Sanitise inputs on submission
    const cleanBusinessName = sanitiseText(businessName)
    const cleanEmail = sanitiseEmail(email)
    const cleanPassword = sanitiseText(password)
    const cleanConfirmPassword = sanitiseText(confirmPassword)

    // 2. Perform validations
    let hasError = false
    
    if (mode === 'register') {
      if (!cleanBusinessName) {
        setBusinessNameError('Business Name is required')
        hasError = true
      }
    }

    if (!cleanEmail) {
      setEmailError('Email address is required')
      hasError = true
    } else if (!validateEmail(cleanEmail)) {
      setEmailError('Please enter a valid email address')
      hasError = true
    }

    if (!cleanPassword) {
      setPasswordError('Password is required')
      hasError = true
    }

    if (mode === 'register') {
      if (!cleanConfirmPassword) {
        setConfirmPasswordError('Please confirm your password')
        hasError = true
      } else if (cleanPassword !== cleanConfirmPassword) {
        setConfirmPasswordError('Passwords do not match')
        hasError = true
      }
    }

    if (hasError) return

    // 3. Authenticate
    setIsLoading(true)
    try {
      if (mode === 'login') {
        const response = await loginWithEmail(cleanEmail, cleanPassword)
        login(response)
      } else {
        const response = await registerBusiness(cleanBusinessName, cleanEmail, cleanPassword)
        login(response)
      }
    } catch (err: any) {
      console.error(err)
      setGeneralError(err.message || 'An error occurred. Please check details and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setGeneralError(null)
    setIsLoading(true)
    try {
      const response = await loginWithGoogle()
      login(response)
    } catch (err: any) {
      console.error(err)
      setGeneralError(err.message || 'Google sign-in failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-surface flex flex-col justify-center items-center p-4">
      {/* Centered Auth Card */}
      <div 
        className="w-full max-w-[420px] bg-white rounded-lg shadow-soft border border-gray-100 p-6 md:p-8 flex flex-col select-none"
      >
        {/* Header Branding */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2 select-none">
            <div className="w-8 h-8 rounded-lg bg-emerald flex items-center justify-center text-white font-bold text-lg shadow-sm">
              C
            </div>
            <span className="font-bold text-lg text-midnight tracking-tight">ConfirmAm</span>
          </div>
          <span className="text-xs font-semibold text-midnight-40 mt-1.5 uppercase tracking-wide text-center">
            {mode === 'login' ? 'Your business payment terminal' : 'Create your business terminal account'}
          </span>
        </div>

        {/* General Alert Banner */}
        {generalError && (
          <div className="flex items-center gap-2 p-3 bg-coral/10 text-coral text-xs font-semibold rounded-xl border border-coral/10 mb-5 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{generalError}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Business Name (Register mode only) */}
          {mode === 'register' && (
            <div className="space-y-1.5">
              <label 
                htmlFor="businessName" 
                className="text-[10px] font-bold text-midnight-60 uppercase tracking-widest block"
              >
                Business Name
              </label>
              <input
                id="businessName"
                type="text"
                placeholder="e.g. Adeyemi Stores"
                value={businessName}
                disabled={isLoading}
                onChange={(e) => setBusinessName(e.target.value)}
                className={cn(
                  "w-full h-12 px-4 text-sm font-semibold text-midnight border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all",
                  businessNameError 
                    ? "border-coral focus:ring-coral/20" 
                    : "border-gray-200 focus:ring-emerald focus:ring-emerald-light"
                )}
              />
              {businessNameError && (
                <p className="text-[11px] font-bold text-coral flex items-center gap-1 mt-1 animate-fade-in">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{businessNameError}</span>
                </p>
              )}
            </div>
          )}

          {/* Email Input */}
          <div className="space-y-1.5">
            <label 
              htmlFor="email" 
              className="text-[10px] font-bold text-midnight-60 uppercase tracking-widest block"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              placeholder="name@business.com"
              value={email}
              disabled={isLoading}
              onChange={(e) => setEmail(e.target.value)}
              className={cn(
                "w-full h-12 px-4 text-sm font-semibold text-midnight border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all",
                emailError 
                  ? "border-coral focus:ring-coral/20" 
                  : "border-gray-200 focus:ring-emerald focus:ring-emerald-light"
              )}
            />
            {emailError && (
              <p className="text-[11px] font-bold text-coral flex items-center gap-1 mt-1 animate-fade-in">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{emailError}</span>
              </p>
            )}
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label 
              htmlFor="password" 
              className="text-[10px] font-bold text-midnight-60 uppercase tracking-widest block"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                disabled={isLoading}
                onChange={(e) => setPassword(e.target.value)}
                className={cn(
                  "w-full h-12 pl-4 pr-10 text-sm font-semibold text-midnight border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all",
                  passwordError 
                    ? "border-coral focus:ring-coral/20" 
                    : "border-gray-200 focus:ring-emerald focus:ring-emerald-light"
                )}
              />
              <button
                type="button"
                tabIndex={-1}
                disabled={isLoading}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-midnight-40 hover:text-midnight transition-colors p-1"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {passwordError && (
              <p className="text-[11px] font-bold text-coral flex items-center gap-1 mt-1 animate-fade-in">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{passwordError}</span>
              </p>
            )}
          </div>

          {/* Confirm Password (Register mode only) */}
          {mode === 'register' && (
            <div className="space-y-1.5">
              <label 
                htmlFor="confirmPassword" 
                className="text-[10px] font-bold text-midnight-60 uppercase tracking-widest block"
              >
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  disabled={isLoading}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={cn(
                    "w-full h-12 pl-4 pr-10 text-sm font-semibold text-midnight border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all",
                    confirmPasswordError 
                      ? "border-coral focus:ring-coral/20" 
                      : "border-gray-200 focus:ring-emerald focus:ring-emerald-light"
                  )}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  disabled={isLoading}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-midnight-40 hover:text-midnight transition-colors p-1"
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPasswordError && (
                <p className="text-[11px] font-bold text-coral flex items-center gap-1 mt-1 animate-fade-in">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{confirmPasswordError}</span>
                </p>
              )}
            </div>
          )}

          {/* Primary Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-emerald hover:bg-emerald-dark disabled:bg-emerald-light text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center select-none pt-0.5"
          >
            <span>
              {isLoading 
                ? (mode === 'login' ? 'Signing in...' : 'Creating account...') 
                : (mode === 'login' ? 'Sign In' : 'Create Account')}
            </span>
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-5">
          <div className="flex-grow border-t border-gray-100" />
          <span className="text-[10px] font-bold text-midnight-40 px-3 uppercase tracking-wider">or</span>
          <div className="flex-grow border-t border-gray-100" />
        </div>

        {/* Google Secondary CTA */}
        <button
          type="button"
          disabled={isLoading}
          onClick={handleGoogleSignIn}
          className="w-full h-12 bg-white border border-midnight/20 hover:bg-gray-50 disabled:bg-gray-50 text-midnight text-xs font-bold rounded-xl transition-all flex items-center justify-center select-none"
        >
          <span>
            {isLoading 
              ? 'Connecting...' 
              : (mode === 'login' ? 'Continue with Google' : 'Register with Google')}
          </span>
        </button>
      </div>

      {/* Toggle mode link below the card */}
      <div className="mt-6 text-center select-none">
        {mode === 'login' ? (
          <p className="text-xs text-midnight-60">
            Don't have an account?{' '}
            <button 
              type="button"
              onClick={() => handleToggleMode('register')}
              className="font-bold text-midnight hover:underline focus:outline-none"
            >
              Register
            </button>
          </p>
        ) : (
          <p className="text-xs text-midnight-60">
            Already have an account?{' '}
            <button 
              type="button"
              onClick={() => handleToggleMode('login')}
              className="font-bold text-midnight hover:underline focus:outline-none"
            >
              Sign In
            </button>
          </p>
        )}
      </div>
    </div>
  )
}
