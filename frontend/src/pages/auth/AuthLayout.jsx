import { useState } from "react";
import { useNavigate } from "react-router-dom";

function AuthLayout({
  title,
  subtitle,
  children,
  footerText,
  switchLabel,
  switchTo,
  backgroundImage,
  formSide = "left",
}) {
  const navigate = useNavigate();
  const [isSwitching, setIsSwitching] = useState(false);
  const isRight = formSide === "right";
  const panelOrder = isRight ? "lg:order-2" : "lg:order-1";
  const heroOrder = isRight ? "lg:order-1" : "lg:order-2";
  const enterAnimation = isRight ? "authEnterFromRight" : "authEnterFromLeft";
  const exitAnimation = isRight ? "authExitToLeft" : "authExitToRight";

  const handleSwitch = () => {
    if (isSwitching) return;
    setIsSwitching(true);
    window.setTimeout(() => {
      navigate(switchTo);
    }, 230);
  };

  return (
    <main className="mx-auto my-8 grid min-h-[88vh] w-full max-w-[1280px] grid-cols-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.08)] lg:grid-cols-[1.05fr_1fr]">
      <section
        className={`${panelOrder} grid place-items-center bg-white px-6 py-8 sm:px-10 lg:px-12`}
      >
        <div
          className="w-full max-w-[440px] min-h-[660px]"
          style={{
            animation: `${isSwitching ? exitAnimation : enterAnimation} 280ms ease both`,
          }}
        >
          <div className="mb-6 inline-flex items-center">
            <img
              src="/logo/logo.png"
              alt="AdvokateDesk"
              className="h-14 w-auto object-contain"
            />
          </div>

          <button
            type="button"
            className="absolute top-5 left-1 cursor-pointer border-none bg-transparent p-0 text-3xl leading-none text-slate-900"
            onClick={() => window.history.back()}
          >
            ←
          </button>

          <h2 className="max-w-[360px] text-5xl leading-[1.04] font-bold tracking-[-0.03em] text-slate-800 sm:text-6xl">
            {title}
          </h2>
          <p className="mt-4 mb-8 max-w-[420px] text-base leading-relaxed text-slate-500">
            {subtitle}
          </p>

          {children}

          <p className="mt-5 text-sm font-medium text-slate-500">
            {footerText}{" "}
            <button
              type="button"
              onClick={handleSwitch}
              className="cursor-pointer border-none bg-transparent p-0 font-bold text-blue-700 hover:text-blue-800"
            >
              {switchLabel}
            </button>
          </p>
        </div>
      </section>

      <section
        className={`${heroOrder} relative m-4 hidden min-h-[640px] overflow-hidden rounded-2xl bg-blue-50 lg:block`}
      >
        <div className="absolute inset-0 z-1 bg-linear-to-b from-blue-400/10 to-slate-400/20" />
        <img
          src={backgroundImage}
          alt="Legal office interior"
          className="absolute inset-0 h-full w-full scale-105 object-cover blur-[2px]"
        />
      </section>
    </main>
  );
}

export default AuthLayout;
