import AuthLayout from './AuthLayout'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginUser } from '../../services/userAPIS'

import { setStoredAccessToken, pickTokenFromLoginResponse, setStoredUser } from '../../utils/authTokenStorage'

function LoginPage() {
  const navigate = useNavigate()
  const labelClass = 'text-[13px] font-semibold text-slate-600'
  const inputClass =
    'w-full rounded-lg border border-[#dbe3f2] bg-[#f2f6ff] px-3.5 py-3 text-sm text-slate-800 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!email.trim() || !password.trim()) {
      setError('Please enter email and password.')
      return
    }

    try {
      setIsSubmitting(true)
      const data = await loginUser({ email, password })
      const token = pickTokenFromLoginResponse(data)
      if (token) {
        setStoredAccessToken(token)
      }
      setStoredUser(data.user)
      navigate('/home')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Login to AdvokateDesk"
      subtitle="Welcome back. Please enter your credentials to access your secure legal dashboard."
      footerText="Don't have an account?"
      switchLabel="Create one"
      switchTo="/signup"
      backgroundImage="/images/login.jpeg"
      formSide="left"
    >
      <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
        <label htmlFor="login-email" className={labelClass}>Email Address</label>
        <input
          id="login-email"
          type="email"
          placeholder="email@.com"
          className={inputClass}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <label htmlFor="login-password" className={labelClass}>Password</label>
        <input
          id="login-password"
          type="password"
          placeholder="Enter password"
          className={inputClass}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-3 rounded-lg bg-linear-to-b from-blue-500 to-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(37,99,235,0.28)] hover:from-blue-400 hover:to-blue-700"
        >
          {isSubmitting ? 'Logging in...' : 'Login'}
        </button>

        <a
          href="/"
          className="mt-2 text-center text-sm text-slate-600 hover:text-slate-800"
          onClick={(event) => event.preventDefault()}
        >
          Forgot password
        </a>
      </form>
    </AuthLayout>
  )
}

export default LoginPage
