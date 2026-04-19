import AuthLayout from "./AuthLayout";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  signupUser,
  verifySignup,
  resendSignupOtp,
} from "../../services/userAPIS";
import {
  setStoredAccessToken,
  pickTokenFromLoginResponse,
  setStoredUser,
} from "../../utils/authTokenStorage";
import { notifyError, notifySuccess } from "../../utils/swal";

function SignupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const labelClass = "text-[13px] font-semibold text-slate-600";
  const inputClass =
    "w-full rounded-lg border border-[#dbe3f2] bg-[#f2f6ff] px-3.5 py-3 text-sm text-slate-800 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200";

  const [step, setStep] = useState("form");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const st = location.state;
    if (st?.step === "verify" && st?.email) {
      setStep("verify");
      setEmail(st.email);
    }
  }, [location.state]);

  const handleSubmitForm = async (event) => {
    event.preventDefault();

    if (
      !fullName.trim() ||
      !email.trim() ||
      !password.trim() ||
      !confirmPassword.trim()
    ) {
      notifyError("Incomplete form", "Please fill all fields.");
      return;
    }

    if (password !== confirmPassword) {
      notifyError("Password mismatch", "Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      notifyError("Weak password", "Password must be at least 6 characters.");
      return;
    }

    try {
      setIsSubmitting(true);
      const data = await signupUser({ fullName, email, password });
      if (data.requiresVerification) {
        notifySuccess("Check your email", "We sent a 6-digit code to your inbox.");
        setStep("verify");
        setOtp("");
      } else {
        const token = pickTokenFromLoginResponse(data);
        if (token) setStoredAccessToken(token);
        if (data.user) setStoredUser(data.user);
        notifySuccess("Welcome!", "Account created. Redirecting...");
        setTimeout(() => navigate("/home"), 900);
      }
    } catch (err) {
      const status = err.response?.status;
      if (status === 503) {
        notifyError(
          "Couldn't send verification code",
          "Please try again in a moment. If the problem continues, contact support.",
        );
      } else {
        notifyError(
          "Signup failed",
          err.response?.data?.message || "Please try again.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async (event) => {
    event.preventDefault();
    if (!email.trim() || !String(otp).trim()) {
      notifyError("Missing code", "Enter the 6-digit code from your email.");
      return;
    }
    const code = String(otp).replace(/\D/g, "");
    if (code.length !== 6) {
      notifyError("Invalid code", "The code must be 6 digits.");
      return;
    }

    try {
      setIsSubmitting(true);
      const data = await verifySignup({ email: email.trim(), otp: code });
      const token = pickTokenFromLoginResponse(data);
      if (token) setStoredAccessToken(token);
      if (data.user) setStoredUser(data.user);
      notifySuccess("Verified!", "Your email is confirmed. Redirecting...");
      setTimeout(() => navigate("/home"), 900);
    } catch (err) {
      notifyError(
        "Verification failed",
        err.response?.data?.message || "Check the code and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim()) {
      notifyError("Missing email", "Email is required.");
      return;
    }
    if (!password.trim()) {
      notifyError("Password required", "Enter your password to resend the code.");
      return;
    }

    try {
      setIsResending(true);
      await resendSignupOtp({ email: email.trim(), password });
      notifySuccess("Code sent", "Check your inbox for a new verification code.");
      setOtp("");
    } catch (err) {
      const status = err.response?.status;
      if (status === 503) {
        notifyError(
          "Couldn't send verification code",
          "Please try again in a moment. If the problem continues, contact support.",
        );
      } else {
        notifyError(
          "Could not resend",
          err.response?.data?.message || "Please try again.",
        );
      }
    } finally {
      setIsResending(false);
    }
  };

  const handleFooterSwitch = () => {
    if (step === "verify") {
      setStep("form");
      setOtp("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setFullName("");
      navigate("/signup", { replace: true, state: {} });
      return;
    }
    navigate("/login", { replace: true });
  };

  return (
    <AuthLayout
      title={step === "form" ? "Create Your Account" : "Verify your email"}
      subtitle={
        step === "form"
          ? "Set up your AdvokateDesk access with institutional credentials."
          : `Enter the 6-digit code sent to ${email || "your email"}.`
      }
      footerText={
        step === "form" ? "Already have an account?" : "Wrong address?"
      }
      switchLabel={step === "form" ? "Log in" : "Start over"}
      switchTo="/login"
      onFooterSwitch={handleFooterSwitch}
      backgroundImage="/images/signup.jpeg"
      formSide="right"
    >
      {step === "form" ? (
        <form className="flex flex-col gap-2" onSubmit={handleSubmitForm}>
          <label htmlFor="signup-name" className={labelClass}>
            Full Name
          </label>
          <input
            id="signup-name"
            type="text"
            placeholder="Your full name"
            className={inputClass}
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
          />

          <label htmlFor="signup-email" className={labelClass}>
            Email Address
          </label>
          <input
            id="signup-email"
            type="email"
            placeholder="you@example.com"
            className={inputClass}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <label htmlFor="signup-password" className={labelClass}>
            Password
          </label>
          <div className="relative">
            <input
              id="signup-password"
              type={showPassword ? "text" : "password"}
              placeholder="Create password"
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <label htmlFor="signup-confirm-password" className={labelClass}>
            Confirm Password
          </label>
          <div className="relative">
            <input
              id="signup-confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm password"
              className={inputClass}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showConfirmPassword ? "Hide" : "Show"}
            </button>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-3 rounded-lg bg-linear-to-b from-blue-500 to-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(37,99,235,0.28)] hover:from-blue-400 hover:to-blue-700 disabled:opacity-60"
          >
            {isSubmitting ? "Sending code..." : "Create Account"}
          </button>
        </form>
      ) : (
        <form className="flex flex-col gap-2" onSubmit={handleVerify}>
          <label htmlFor="verify-email" className={labelClass}>
            Email
          </label>
          <input
            id="verify-email"
            type="email"
            readOnly
            className={`${inputClass} bg-slate-100 text-slate-600`}
            value={email}
          />

          <label htmlFor="signup-otp" className={labelClass}>
            Verification code
          </label>
          <input
            id="signup-otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            className={`${inputClass} tracking-[0.35em] font-mono text-center text-lg`}
            value={otp}
            onChange={(e) =>
              setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-3 rounded-lg bg-linear-to-b from-blue-500 to-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(37,99,235,0.28)] hover:from-blue-400 hover:to-blue-700 disabled:opacity-60"
          >
            {isSubmitting ? "Verifying..." : "Verify & continue"}
          </button>

          <p className="mt-2 text-center text-xs text-slate-500">
            Didn&apos;t get a code? Enter your password and tap resend.
          </p>

          <label htmlFor="verify-password-resend" className={labelClass}>
            Password (for resend)
          </label>
          <input
            id="verify-password-resend"
            type="password"
            placeholder="Your account password"
            className={inputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="button"
            disabled={isResending}
            onClick={handleResend}
            className="rounded-lg border border-[#dbe3f2] bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {isResending ? "Sending..." : "Resend code"}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}

export default SignupPage;
