import { useState } from "react";

const faqs = [
  {
    q: "How are lawyers on AdvokateDesk vetted?",
    a: "Every counsel listed goes through a multi-step institutional due diligence process — including bar verification, outcomes history review, and peer references — before appearing on the platform.",
  },
  {
    q: "Is my information kept confidential?",
    a: "Yes. All consultations and document exchanges happen over encrypted channels. We maintain institution-grade confidentiality standards across every matter on the platform.",
  },
  {
    q: "How quickly can I get matched with a lawyer?",
    a: "Most clients are matched within 24 hours. For urgent matters, we offer priority matching that can connect you with available counsel in as little as a few hours.",
  },
  {
    q: "What practice areas does AdvokateDesk cover?",
    a: "We cover Corporate Law, Intellectual Property, Litigation, Arbitration, and more. Our network spans multiple jurisdictions and continues to grow.",
  },
  {
    q: "How does pricing work?",
    a: "All fee structures are transparent and scoped before engagement begins. You will always know the deliverables and cost before committing — no hidden billing.",
  },
  {
    q: "Can I use AdvokateDesk as an individual, not a business?",
    a: "Absolutely. While the platform is built to handle institutional complexity, individuals can equally access verified counsel, free consultations, and legal tools like the penal code search.",
  },
];

function FaqAccordion({ theme = "dark" }) {
  const isDark = theme === "dark";
  const [open, setOpen] = useState(null);

  return (
    <div
      className={`mx-auto max-w-3xl divide-y ${
        isDark ? "divide-[#1e3a5f]" : "divide-slate-300"
      }`}
    >
      {faqs.map((item, i) => (
        <div key={i} className="py-5">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between gap-4 text-left"
          >
            <span
              className={`text-sm font-semibold ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              {item.q}
            </span>
            <span
              className={`shrink-0 text-[#60a5fa] transition-transform duration-300 ${
                open === i ? "rotate-45" : ""
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-5 w-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </span>
          </button>
          <div
            className={`overflow-hidden transition-all duration-300 ${
              open === i ? "max-h-40 mt-3" : "max-h-0"
            }`}
          >
            <p
              className={`text-sm leading-relaxed ${
                isDark ? "text-[#9ab4ce]" : "text-slate-600"
              }`}
            >
              {item.a}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default FaqAccordion;
