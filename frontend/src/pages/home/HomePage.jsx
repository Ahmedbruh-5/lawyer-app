import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import HeroHome from "../../components/home/HeroHome";
import FaqAccordion from "../../components/home/FaqAccordion";
import HomeHeader from "../../components/layout/HomeHeader";
import HomeFooter from "../../components/layout/HomeFooter";
import { getLawyers } from "../../services/lawyerAPIs";

const practiceAreas = [
  {
    title: "Corporate Law",
    description:
      "Mergers, governance, and legal advice tailored for business operations.",
  },
  {
    title: "Intellectual Property",
    description:
      "Protecting your innovations and brand assets in a global marketplace.",
  },
  {
    title: "Litigation",
    description:
      "Representation and strategy for high-stakes disputes and claims.",
  },
  {
    title: "Arbitration",
    description:
      "Efficient dispute resolution for institutional and private cases.",
  },
];

const contentShell = "mx-auto w-full max-w-[1600px] px-6 lg:px-14";

/** Up to two letters from the lawyer's name (first + last word, or first two chars). */
function getLawyerInitials(name) {
  if (!name || typeof name !== "string") return "?";
  const parts = name.split(/[\s,]+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0][0];
    const b = parts[1][0];
    return `${a}${b}`.toUpperCase();
  }
  const single = parts[0];
  return (single.length >= 2 ? single.slice(0, 2) : single[0]).toUpperCase();
}

function HomePage() {
  const { t } = useTranslation();
  const location = useLocation();
  const [featuredLawyers, setFeaturedLawyers] = useState([]);
  const [lawyersLoading, setLawyersLoading] = useState(true);
  const [lawyersError, setLawyersError] = useState("");
  const [profileLawyer, setProfileLawyer] = useState(null);

  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
    return "dark";
  });

  useEffect(() => {
    const syncTheme = () => {
      const currentTheme =
        document.documentElement.getAttribute("data-theme") ||
        localStorage.getItem("theme") ||
        "dark";
      setTheme(currentTheme);
    };

    syncTheme();
    window.addEventListener("theme-change", syncTheme);
    window.addEventListener("storage", syncTheme);

    return () => {
      window.removeEventListener("theme-change", syncTheme);
      window.removeEventListener("storage", syncTheme);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLawyersLoading(true);
        setLawyersError("");
        const data = await getLawyers();
        if (!cancelled) {
          const list = data?.data || [];
          setFeaturedLawyers(list.slice(0, 6));
        }
      } catch {
        if (!cancelled) {
          setLawyersError(t("home.lawyers_load_error", "Could not load featured lawyers."));
        }
      } finally {
        if (!cancelled) setLawyersLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [t]);

  useEffect(() => {
    if (!profileLawyer) return;
    const onKey = (event) => {
      if (event.key === "Escape") setProfileLawyer(null);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [profileLawyer]);

  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.replace("#", "");
    const timer = window.setTimeout(() => {
      const el = document.getElementById(id);
      if (!el) return;
      const headerOffset = 96;
      const top = el.getBoundingClientRect().top + window.scrollY - headerOffset;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [location.pathname, location.hash]);

  const isDark = theme === "dark";
  const howItWorks = [
    { step: "01", title: t("home.how_step_1_title"), desc: t("home.how_step_1_desc") },
    { step: "02", title: t("home.how_step_2_title"), desc: t("home.how_step_2_desc") },
    { step: "03", title: t("home.how_step_3_title"), desc: t("home.how_step_3_desc") },
  ];

  const valuePillars = [
    { title: t("home.pillar_1_title"), description: t("home.pillar_1_desc"), accent: "from-[#0b2038] to-[#102a47]" },
    { title: t("home.pillar_2_title"), description: t("home.pillar_2_desc"), accent: "from-[#003b73] to-[#0a4e92]" },
    { title: t("home.pillar_3_title"), description: t("home.pillar_3_desc"), accent: "from-[#132f4d] to-[#1a3b5f]" },
  ];

  const testimonials = [
    { quote: t("home.testimonial_1_quote"), author: t("home.testimonial_1_author") },
    { quote: t("home.testimonial_2_quote"), author: t("home.testimonial_2_author") },
    { quote: t("home.testimonial_3_quote"), author: t("home.testimonial_3_author") },
  ];

  return (
    <main
      className={`min-h-screen w-full transition-colors ${
        isDark ? "bg-[#020c1b] text-slate-100" : "bg-slate-50 text-slate-900"
      }`}
    >
      <HomeHeader contentShell={contentShell} />

      <HeroHome contentShell={contentShell} theme={theme} />

      {/* About */}
      <section
        id="about"
        className={`scroll-mt-24 w-full py-14 ${isDark ? "bg-[#020c1b]" : "bg-white"}`}
      >
        <div className={contentShell}>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className={`text-3xl font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
              {t("home.about_title")}
            </h2>
            <p className={`mt-4 text-lg font-medium leading-relaxed ${isDark ? "text-[#c4d8ed]" : "text-slate-800"}`}>
              {t("home.about_lead")}
            </p>
          </div>
          <div
            className={`mx-auto mt-10 max-w-3xl space-y-5 text-sm leading-relaxed md:text-base ${
              isDark ? "text-[#9ab4ce]" : "text-slate-600"
            }`}
          >
            <p>{t("home.about_p1")}</p>
            <p>{t("home.about_p2")}</p>
            <p>{t("home.about_p3")}</p>
          </div>
        </div>
      </section>

      {/* Practice Areas — full bleed section, no inner card */}
      {/* <section
        id="practice-areas"
        className={`scroll-mt-24 w-full py-14 ${isDark ? "bg-[#061427]" : "bg-white"}`}
      >
        <div className={contentShell}>
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className={`text-3xl font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
                {t("home.practice_areas")}
              </h2>
              <p className={`mt-2 text-sm ${isDark ? "text-[#9ab4ce]" : "text-slate-600"}`}>
                {t("home.practice_subtitle")}
              </p>
            </div>
            <a
              href="/"
              onClick={(e) => e.preventDefault()}
              className="text-sm font-semibold text-[#60a5fa]"
            >
              View all practices
            </a>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {practiceAreas.map((item) => (
              <article
                key={item.title}
                className={`rounded-2xl border p-5 transition hover:-translate-y-1 hover:shadow-lg ${
                  isDark
                    ? "border-[#1e3a5f] bg-linear-to-b from-[#0b2038] to-[#0e2947] hover:border-[#3b82f6]/60"
                    : "border-slate-200 bg-slate-50 hover:border-blue-300"
                }`}
              >
                <div className={`mb-3 h-10 w-10 rounded-lg ${isDark ? "bg-[#1b3d66]" : "bg-blue-100"}`} />
                <h3 className={`text-lg font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
                  {item.title}
                </h3>
                <p className={`mt-2 text-sm ${isDark ? "text-[#9ab4ce]" : "text-slate-600"}`}>
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section> */}

      {/* How It Works */}
      <section className={`w-full py-14 ${isDark ? "bg-[#020c1b]" : "bg-slate-50"}`}>
        <div className={contentShell}>
          <h2 className={`text-center text-3xl font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
            {t("home.how_it_works_title")}
          </h2>
          <p className={`mx-auto mt-3 max-w-2xl text-center text-sm ${isDark ? "text-[#9ab4ce]" : "text-slate-600"}`}>
            {t("home.how_it_works_subtitle")}
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {howItWorks.map((item) => (
              <div
                key={item.step}
                className={`relative rounded-2xl border p-6 ${isDark ? "border-[#1e3a5f] bg-[#0b2038]" : "border-slate-200 bg-white"}`}
              >
                <span className={`text-5xl font-bold ${isDark ? "text-[#1e3a5f]" : "text-blue-200"}`}>
                  {item.step}
                </span>
                <h3 className={`mt-3 text-lg font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
                  {item.title}
                </h3>
                <p className={`mt-2 text-sm ${isDark ? "text-[#9ab4ce]" : "text-slate-600"}`}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why AdvokateDesk — full bleed section, no inner card */}
      <section className={`w-full py-14 ${isDark ? "bg-[#020c1b]" : "bg-white"}`}>
        <div className={contentShell}>
          <h2 className={`text-center text-3xl font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
            {t("home.why_title")}
          </h2>
          <p className={`mx-auto mt-3 max-w-2xl text-center text-sm ${isDark ? "text-[#9ab4ce]" : "text-slate-600"}`}>
            {t("home.why_subtitle")}
          </p>
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {valuePillars.map((pillar) => (
              <article
                key={pillar.title}
                className={
                  isDark
                    ? `rounded-2xl border border-[#1e3a5f] bg-linear-to-b ${pillar.accent} p-6`
                    : 'rounded-2xl border border-slate-200 bg-linear-to-br from-white to-slate-100 p-6 shadow-sm'
                }
              >
                <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {pillar.title}
                </h3>
                <p className={`mt-2 text-sm ${isDark ? 'text-[#c4d8ed]' : 'text-slate-600'}`}>
                  {pillar.description}
                </p>
              </article>
            ))}
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-3xl font-bold text-[#60a5fa]">98%</p>
              <p className={`text-sm ${isDark ? 'text-[#9ab4ce]' : 'text-slate-600'}`}>{t("home.stat_retention")}</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-[#60a5fa]">24h</p>
              <p className={`text-sm ${isDark ? 'text-[#9ab4ce]' : 'text-slate-600'}`}>
                {t("home.stat_match")}
              </p>
            </div>
            <div>
              <p className="text-3xl font-bold text-[#60a5fa]">100%</p>
              <p className={`text-sm ${isDark ? 'text-[#9ab4ce]' : 'text-slate-600'}`}>
                {t("home.stat_confidentiality")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Counsel — full bleed section, no inner card */}
      <section
        id="featured-counsel"
        className={`scroll-mt-24 w-full py-14 ${isDark ? "bg-[#061427]" : "bg-slate-100"}`}
      >
        <div className={contentShell}>
          <h2 className={`text-3xl font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
            {t("home.featured_title")}
          </h2>
          {lawyersLoading && (
            <p className={`mt-6 text-sm ${isDark ? "text-[#9ab4ce]" : "text-slate-600"}`}>
              {t("home.lawyers_loading", "Loading featured counsel...")}
            </p>
          )}
          {!!lawyersError && (
            <p className="mt-6 text-sm text-red-400" role="alert">
              {lawyersError}
            </p>
          )}
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {!lawyersLoading &&
              featuredLawyers.map((lawyer) => (
                <article
                  key={lawyer._id || lawyer.name}
                  role="button"
                  tabIndex={0}
                  onClick={() => setProfileLawyer(lawyer)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setProfileLawyer(lawyer);
                    }
                  }}
                  className={`flex gap-4 rounded-2xl border p-4 text-left transition hover:ring-2 hover:ring-[#3b82f6]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60a5fa] ${
                    isDark ? "border-[#1e3a5f] bg-[#0b2038]" : "border-slate-200 bg-white"
                  } cursor-pointer`}
                >
                  <div className="flex h-24 w-20 shrink-0 items-center justify-center rounded-md bg-linear-to-br from-[#274a73] to-[#1b3250] text-xl font-bold tracking-tight text-white">
                    {getLawyerInitials(lawyer.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className={`text-lg font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
                      {lawyer.name}
                    </h3>
                    <p className={`text-sm font-medium ${isDark ? "text-[#9ab4ce]" : "text-slate-600"}`}>
                      {lawyer.specialty}
                    </p>
                    {(lawyer.location || lawyer.rate) && (
                      <p className={`mt-1 text-xs ${isDark ? "text-[#7c9cbc]" : "text-slate-500"}`}>
                        {[lawyer.location, lawyer.rate].filter(Boolean).join(" · ")}
                      </p>
                    )}
                    {lawyer.bio ? (
                      <p className={`mt-2 line-clamp-3 text-sm ${isDark ? "text-[#c4d8ed]" : "text-slate-600"}`}>
                        {lawyer.bio}
                      </p>
                    ) : (
                      <p className={`mt-2 text-sm italic ${isDark ? "text-[#7c9cbc]" : "text-slate-500"}`}>
                        {t("home.no_bio", "Bio coming soon.")}
                      </p>
                    )}
                    {(lawyer.phone || lawyer.email) && (
                      <div className={`mt-2 space-y-0.5 text-xs ${isDark ? "text-[#9ab4ce]" : "text-slate-600"}`}>
                        {lawyer.phone && <p>{lawyer.phone}</p>}
                        {lawyer.email && (
                          <p className="truncate text-[#60a5fa]" title={lawyer.email}>
                            {lawyer.email}
                          </p>
                        )}
                      </div>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {lawyer.email ? (
                        <a
                          href={`mailto:${lawyer.email}`}
                          onClick={(event) => event.stopPropagation()}
                          className={`rounded-lg border px-3 py-1 text-xs font-semibold ${
                            isDark ? "border-[#1e3a5f] bg-[#0f2a48] text-[#c4d8ed]" : "border-slate-300 bg-slate-100 text-slate-800"
                          }`}
                        >
                          {t("home.email_counsel", "Email")}
                        </a>
                      ) : (
                        <span
                          className={`rounded-lg border px-3 py-1 text-xs font-semibold opacity-50 ${
                            isDark ? "border-[#1e3a5f] text-[#c4d8ed]" : "border-slate-300 text-slate-600"
                          }`}
                        >
                          {t("home.email_counsel", "Email")}
                        </span>
                      )}
                      {lawyer.phone ? (
                        <a
                          href={`tel:${lawyer.phone.replace(/\s+/g, "")}`}
                          onClick={(event) => event.stopPropagation()}
                          className="rounded-lg bg-[#1d4ed8] px-3 py-1 text-xs font-semibold text-white hover:bg-[#2563eb]"
                        >
                          {t("home.schedule_call")}
                        </a>
                      ) : (
                        <span className="cursor-not-allowed rounded-lg bg-slate-600 px-3 py-1 text-xs font-semibold text-white opacity-50">
                          {t("home.schedule_call")}
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              ))}
          </div>
          {!lawyersLoading && !lawyersError && !featuredLawyers.length && (
            <p className={`mt-6 text-sm ${isDark ? "text-[#9ab4ce]" : "text-slate-600"}`}>
              {t("home.lawyers_empty", "Featured counsel will appear here once added in the admin panel.")}
            </p>
          )}
        </div>
      </section>

      {profileLawyer && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]"
          role="presentation"
          onClick={() => setProfileLawyer(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="lawyer-profile-title"
            className={`relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border p-6 shadow-xl ${
              isDark ? "border-[#1e3a5f] bg-[#0b2038] text-slate-100" : "border-slate-200 bg-white text-slate-900"
            }`}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className={`absolute right-4 top-4 rounded-lg px-2 py-1 text-2xl leading-none transition hover:bg-white/10 ${
                isDark ? "text-[#9ab4ce]" : "text-slate-500 hover:bg-slate-100"
              }`}
              aria-label={t("home.close_profile", "Close")}
              onClick={() => setProfileLawyer(null)}
            >
              ×
            </button>
            <div className="flex flex-col items-center gap-4 border-b border-[#1e3a5f]/40 pb-6 pt-2">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-[#274a73] to-[#1b3250] text-3xl font-bold text-white">
                {getLawyerInitials(profileLawyer.name)}
              </div>
              <div className="text-center">
                <h3 id="lawyer-profile-title" className={`text-xl font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
                  {profileLawyer.name}
                </h3>
                <p className={`mt-1 text-sm ${isDark ? "text-[#9ab4ce]" : "text-slate-600"}`}>{profileLawyer.specialty}</p>
                {(profileLawyer.location || profileLawyer.rate) && (
                  <p className={`mt-2 text-xs ${isDark ? "text-[#7c9cbc]" : "text-slate-500"}`}>
                    {[profileLawyer.location, profileLawyer.rate].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
            </div>
            <dl className={`mt-6 space-y-4 text-sm ${isDark ? "text-[#c4d8ed]" : "text-slate-700"}`}>
              {profileLawyer.bio ? (
                <div>
                  <dt className={`mb-1 text-xs font-semibold uppercase tracking-wide ${isDark ? "text-[#7c9cbc]" : "text-slate-500"}`}>
                    {t("home.profile_bio", "Bio")}
                  </dt>
                  <dd className="leading-relaxed">{profileLawyer.bio}</dd>
                </div>
              ) : (
                <p className={`text-sm italic ${isDark ? "text-[#7c9cbc]" : "text-slate-500"}`}>
                  {t("home.no_bio", "Bio coming soon.")}
                </p>
              )}
              {profileLawyer.phone && (
                <div>
                  <dt className={`mb-1 text-xs font-semibold uppercase tracking-wide ${isDark ? "text-[#7c9cbc]" : "text-slate-500"}`}>
                    {t("home.profile_phone", "Phone")}
                  </dt>
                  <dd>
                    <a href={`tel:${profileLawyer.phone.replace(/\s+/g, "")}`} className="text-[#60a5fa] hover:underline">
                      {profileLawyer.phone}
                    </a>
                  </dd>
                </div>
              )}
              {profileLawyer.email && (
                <div>
                  <dt className={`mb-1 text-xs font-semibold uppercase tracking-wide ${isDark ? "text-[#7c9cbc]" : "text-slate-500"}`}>
                    {t("home.profile_email", "Email")}
                  </dt>
                  <dd>
                    <a href={`mailto:${profileLawyer.email}`} className="break-all text-[#60a5fa] hover:underline">
                      {profileLawyer.email}
                    </a>
                  </dd>
                </div>
              )}
              {profileLawyer.verified !== undefined && (
                <div>
                  <dt className={`mb-1 text-xs font-semibold uppercase tracking-wide ${isDark ? "text-[#7c9cbc]" : "text-slate-500"}`}>
                    {t("home.profile_verified", "Verified")}
                  </dt>
                  <dd>{profileLawyer.verified ? t("home.profile_yes", "Yes") : t("home.profile_no", "No")}</dd>
                </div>
              )}
            </dl>
            <div className="mt-8 flex flex-wrap gap-3">
              {profileLawyer.email && (
                <a
                  href={`mailto:${profileLawyer.email}`}
                  className={`rounded-lg border px-4 py-2 text-sm font-semibold ${
                    isDark ? "border-[#1e3a5f] bg-[#0f2a48] text-[#c4d8ed]" : "border-slate-300 bg-slate-100 text-slate-800"
                  }`}
                >
                  {t("home.email_counsel", "Email")}
                </a>
              )}
              {profileLawyer.phone && (
                <a
                  href={`tel:${profileLawyer.phone.replace(/\s+/g, "")}`}
                  className="rounded-lg bg-[#1d4ed8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2563eb]"
                >
                  {t("home.schedule_call")}
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Testimonials */}
      <section className={`w-full py-14 ${isDark ? "bg-[#020c1b]" : "bg-slate-50"}`}>
        <div className={contentShell}>
          <h2 className={`text-3xl font-semibold text-center ${isDark ? "text-white" : "text-slate-900"}`}>
            {t("home.clients_title")}
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <article
                key={testimonial.author}
                className={`rounded-2xl border p-6 ${isDark ? "border-[#1e3a5f] bg-[#061427]" : "border-slate-200 bg-white"}`}
              >
                <p className={`text-sm leading-relaxed ${isDark ? "text-[#c4d8ed]" : "text-slate-700"}`}>
                  "{testimonial.quote}"
                </p>
                <p className="mt-4 text-xs font-semibold text-[#60a5fa]">
                  — {testimonial.author}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner — intentionally kept as a standalone card */}
      <section className={`w-full py-14 ${isDark ? "bg-[#020c1b]" : "bg-white"}`}>
        <div className={contentShell}>
          <div className="overflow-hidden rounded-3xl bg-linear-to-r from-[#003b73] to-[#0a4e92] px-8 py-12 text-center text-white shadow-[0_18px_35px_rgba(0,59,115,0.24)]">
            <h2 className="text-3xl font-semibold">
              Secure Your Strategic Advantage
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-blue-100">
              Access the most trusted legal expertise built for institutions
              navigating critical decisions.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button className="rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-[#003b73]">
                Begin Your Search
              </button>
              <button className="rounded-md border border-blue-200 px-5 py-2.5 text-sm font-semibold text-white">
                Speak to a Specialist
              </button>
            </div>
          </div>
        </div>
      </section>
      {/* FAQ */}
      <section
        id="faq"
        className={`scroll-mt-24 w-full py-14 ${isDark ? "bg-[#061427]" : "bg-slate-100"}`}
      >
        <div className={contentShell}>
          <div className="mb-10 text-center">
            <h2 className={`text-3xl font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{t("home.faq_title")}</h2>
            <p className={`mt-3 text-sm ${isDark ? "text-[#9ab4ce]" : "text-slate-600"}`}>{t("home.faq_subtitle")}</p>
          </div>
          <FaqAccordion theme={theme} />
        </div>
      </section>

      <HomeFooter contentShell={contentShell} />
    </main>
  );
}

export default HomePage;
