import AuthLayout from "./AuthLayout";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signupUser } from "../../services/userAPIS";
import {
  setStoredAccessToken,
  pickTokenFromLoginResponse,
  setStoredUser,
} from "../../utils/authTokenStorage";

function SignupPage() {
  const navigate = useNavigate();
  const labelClass = "text-[13px] font-semibold text-slate-600";
  const inputClass =
    "w-full rounded-lg border border-[#dbe3f2] bg-[#f2f6ff] px-3.5 py-3 text-sm text-slate-800 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200";
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (
      !fullName.trim() ||
      !email.trim() ||
      !password.trim() ||
      !confirmPassword.trim()
    ) {
      setError("Please fill all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      setIsSubmitting(true);
      const data = await signupUser({ fullName, email, password });
      const token = pickTokenFromLoginResponse(data);
      if (token) {
        setStoredAccessToken(token);
      }
      setStoredUser(data.user);
      setSuccessMessage("Account created successfully. Redirecting...");
      setTimeout(() => navigate("/home"), 800);
    } catch (err) {
      setError(
        err.response?.data?.message || "Signup failed. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create Your Account"
      subtitle="Set up your AdvokateDesk access with institutional credentials."
      footerText="Already have an account?"
      switchLabel="Log in"
      switchTo="/login"
      backgroundImage="/images/signup.jpeg"
      formSide="right"
    >
      <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
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
          placeholder="email@.com"
          className={inputClass}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        {/* Password */}
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

        {/* Confirm Password */}
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

        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        {successMessage && (
          <p className="mt-1 text-sm text-green-600">{successMessage}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-3 rounded-lg bg-linear-to-b from-blue-500 to-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(37,99,235,0.28)] hover:from-blue-400 hover:to-blue-700"
        >
          {isSubmitting ? "Creating..." : "Create Account"}
        </button>
      </form>
    </AuthLayout>
  );
}

export default SignupPage;
