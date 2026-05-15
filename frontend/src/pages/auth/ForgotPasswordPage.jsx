import AuthLayout from './AuthLayout'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { requestPasswordReset, resetPassword } from '../../services/userAPIS'
import { notifyError, notifySuccess } from '../../utils/swal'

function ForgotPasswordPage() {
  const navigate = useNavigate()
  const labelClass = 'text-[13px] font-semibold text-slate-600'
  const inputClass =
    'w-full rounded-lg border border-[#dbe3f2] bg-[#f2f6ff] px-3.5 py-3 text-sm text-slate-800 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200'

  const [step, setStep] = useState('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleRequestCode = async (event) => {
    event.preventDefault()

    if (!email.trim()) {
      notifyError('Missing email', 'Enter the email address for your account.')
      return
    }

    try {
      setIsSubmitting(true)
      await requestPasswordReset({ email: email.trim() })
      notifySuccess('Check your email', 'We sent a 6-digit reset code if the account exists.')
      setStep('reset')
      setOtp('')
    } catch (err) {
      const status = err.response?.status
      if (status === 503) {
        notifyError(
          "Couldn't send reset code",
          'Please try again in a moment. If the problem continues, contact support.',
        )
      } else {
        notifyError('Reset failed', err.response?.data?.message || 'Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResetPassword = async (event) => {
    event.preventDefault()

    const code = String(otp).replace(/\D/g, '')
    if (!email.trim() || code.length !== 6) {
      notifyError('Invalid code', 'Enter the 6-digit code from your email.')
      return
    }

    if (!password.trim() || !confirmPassword.trim()) {
      notifyError('Missing password', 'Enter and confirm your new password.')
      return
    }

    if (password !== confirmPassword) {
      notifyError('Password mismatch', 'Passwords do not match.')
      return
    }

    if (password.length < 6) {
      notifyError('Weak password', 'Password must be at least 6 characters.')
      return
    }

    try {
      setIsSubmitting(true)
      await resetPassword({ email: email.trim(), otp: code, password })
      notifySuccess('Password reset', 'You can now log in with your new password.')
      setTimeout(() => navigate('/login', { replace: true }), 900)
    } catch (err) {
      notifyError(
        'Could not reset password',
        err.response?.data?.message || 'Check the code and try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFooterSwitch = () => {
    navigate('/login', { replace: true })
  }

  return (
    <AuthLayout
      title={step === 'email' ? 'Reset Password' : 'Enter Reset Code'}
      subtitle={
        step === 'email'
          ? 'Enter your account email and we will send you a secure reset code.'
          : `Use the 6-digit code sent to ${email || 'your email'} and choose a new password.`
      }
      footerText="Remembered your password?"
      switchLabel="Log in"
      switchTo="/login"
      onFooterSwitch={handleFooterSwitch}
      backgroundImage="/images/login.jpeg"
      formSide="left"
    >
      {step === 'email' ? (
        <form className="flex flex-col gap-2" onSubmit={handleRequestCode}>
          <label htmlFor="reset-email" className={labelClass}>
            Email Address
          </label>
          <input
            id="reset-email"
            type="email"
            placeholder="you@example.com"
            className={inputClass}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-3 rounded-lg bg-linear-to-b from-blue-500 to-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(37,99,235,0.28)] hover:from-blue-400 hover:to-blue-700 disabled:opacity-60"
          >
            {isSubmitting ? 'Sending code...' : 'Send reset code'}
          </button>
        </form>
      ) : (
        <form className="flex flex-col gap-2" onSubmit={handleResetPassword}>
          <label htmlFor="reset-code" className={labelClass}>
            Reset code
          </label>
          <input
            id="reset-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            className={`${inputClass} text-center font-mono text-lg tracking-[0.35em]`}
            value={otp}
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
          />

          <label htmlFor="new-password" className={labelClass}>
            New password
          </label>
          <input
            id="new-password"
            type="password"
            placeholder="Create new password"
            className={inputClass}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          <label htmlFor="confirm-new-password" className={labelClass}>
            Confirm new password
          </label>
          <input
            id="confirm-new-password"
            type="password"
            placeholder="Confirm new password"
            className={inputClass}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-3 rounded-lg bg-linear-to-b from-blue-500 to-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(37,99,235,0.28)] hover:from-blue-400 hover:to-blue-700 disabled:opacity-60"
          >
            {isSubmitting ? 'Resetting...' : 'Reset password'}
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleRequestCode}
            className="rounded-lg border border-[#dbe3f2] bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            Resend code
          </button>
        </form>
      )}
    </AuthLayout>
  )
}

export default ForgotPasswordPage
