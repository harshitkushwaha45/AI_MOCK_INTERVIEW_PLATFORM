const features = [
  {
    icon: "resume",
    title: "Resume Analysis",
    description: "Extract skills, experience and key highlights",
  },
  {
    icon: "questions",
    title: "Smart Questions",
    description: "Get role based questions tailored for you",
  },
  {
    icon: "feedback",
    title: "Instant Feedback",
    description: "AI evaluates your answers instantly",
  },
  {
    icon: "report",
    title: "Performance Report",
    description: "Track your progress and improve",
  },
];

function ArenaIcon({ name, className = "" }) {
  const iconClassName = ["arena-svg-icon", className].filter(Boolean).join(" ");

  const icons = {
    brand: (
      <>
        <path d="M6 3h8l4 4v14H6z" />
        <path d="M14 3v5h5" />
        <path d="M8.5 12h5" />
        <path d="M8.5 16h3" />
        <path d="M17.5 15.5l2 2 3-4" />
      </>
    ),
    resume: (
      <>
        <path d="M7 4h7l4 4v12H7z" />
        <path d="M14 4v5h5" />
        <path d="M10 13h4" />
        <path d="M10 17h7" />
        <path d="M5 11H3v8h8v-2" />
      </>
    ),
    questions: (
      <>
        <path d="M6 5h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-6l-4 3v-3H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
        <path d="M12 13v-.35c0-.85.48-1.25 1.05-1.64.53-.37.95-.67.95-1.34 0-.76-.62-1.23-1.46-1.23-.83 0-1.43.41-1.62 1.17" />
        <path d="M12 15.75h.01" />
      </>
    ),
    feedback: (
      <>
        <path d="M6 6h11a3 3 0 0 1 3 3v8H9l-5 3V9a3 3 0 0 1 3-3z" />
        <path d="M12 10v6" />
        <path d="M9 13h6" />
        <path d="M17 4v4" />
        <path d="M15 6h4" />
      </>
    ),
    report: (
      <>
        <path d="M5 20h14" />
        <path d="M7 17v-5" />
        <path d="M11 17V8" />
        <path d="M15 17V5" />
        <path d="M19 17v-9" />
      </>
    ),
    uploadFile: (
      <>
        <path d="M7 3h8l4 4v14H7z" />
        <path d="M15 3v5h5" />
        <path d="M12 17v-6" />
        <path d="M9.5 13.5 12 11l2.5 2.5" />
      </>
    ),
    cloudUpload: (
      <>
        <path d="M16.5 18.5h1.25a4.25 4.25 0 0 0 .32-8.49 6.1 6.1 0 0 0-11.74 1.57A3.75 3.75 0 0 0 7.25 19H8" />
        <path d="M12 20v-8" />
        <path d="M8.75 15.25 12 12l3.25 3.25" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      className={iconClassName}
      fill="none"
      focusable="false"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.9"
      viewBox="0 0 24 24"
    >
      {icons[name]}
    </svg>
  );
}

function ArenaShell({ children, rightAction }) {
  return (
    <div className="arena-entry">
      <div className="arena-bg-shape arena-bg-shape--top" />
      <div className="arena-bg-shape arena-bg-shape--bottom" />
      <div className="arena-bg-dot arena-bg-dot--small" />
      <div className="arena-bg-dot arena-bg-dot--large" />

      <header className="arena-header">
        <div className="arena-brand" aria-label="AI Interview Arena">
          <span className="arena-brand__icon">
            <ArenaIcon name="brand" />
          </span>
          <span>AI Interview Arena</span>
        </div>

        {rightAction && <div className="arena-header__action">{rightAction}</div>}
      </header>

      <main className="arena-layout">
        <section className="arena-copy" aria-label="AI mock interview overview">
          <span className="arena-kicker">AI Powered</span>

          <h1 className="arena-title">
            AI Mock
            <br />
            Interview
          </h1>

          <p className="arena-subtitle">
            Practice smart. Improve faster.
            <br />
            Crack your <span>dream job.</span>
          </p>

          <div className="arena-features">
            {features.map((feature) => (
              <article className="arena-feature" key={feature.title}>
                <span className="arena-feature__icon">
                  <ArenaIcon name={feature.icon} />
                </span>

                <div>
                  <h2>{feature.title}</h2>
                  <p>{feature.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="arena-panel-slot">{children}</section>
      </main>
    </div>
  );
}

export { ArenaIcon, ArenaShell };
