'use client';

const steps = [
  {
    number: '01',
    title: 'Perceive',
    subtitle: 'Data Collection Layer',
    description: 'Continuously monitors 14 on-chain metrics from multiple data providers. MVRV Z-Score, Puell Multiple, RHODL Ratio, Reserve Risk, and more.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
    color: 'blue',
  },
  {
    number: '02',
    title: 'Analyze',
    subtitle: 'Intelligence Engine',
    description: 'Scores each indicator against historical cycle thresholds. Generates a bottom score (0-8) and top score (0-6) to determine market phase.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    color: 'emerald',
  },
  {
    number: '03',
    title: 'Act',
    subtitle: 'Execution Layer',
    description: 'Generates clear ACCUMULATE or DISTRIBUTE signals. Executes portfolio rebalancing on Solana with configurable risk parameters.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    color: 'purple',
  },
];

const colorMap: Record<string, { border: string; bg: string; text: string; glow: string }> = {
  blue: {
    border: 'border-blue-500/30',
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    glow: 'shadow-blue-500/10',
  },
  emerald: {
    border: 'border-emerald-400/30',
    bg: 'bg-emerald-400/10',
    text: 'text-emerald-400',
    glow: 'shadow-emerald-400/10',
  },
  purple: {
    border: 'border-purple-400/30',
    bg: 'bg-purple-400/10',
    text: 'text-purple-400',
    glow: 'shadow-purple-400/10',
  },
};

export default function HowItWorks() {
  return (
    <section className="py-20 px-6 bg-slate-900/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            How Aquiles Works
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            A three-layer autonomous agent that transforms on-chain data into actionable intelligence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step) => {
            const colors = colorMap[step.color];
            return (
              <div
                key={step.number}
                className={`relative rounded-2xl border ${colors.border} bg-slate-950/50 p-8 hover:shadow-2xl ${colors.glow} transition-all duration-300`}
              >
                {/* Step number */}
                <div className="text-xs font-mono text-slate-600 mb-4">{step.number}</div>

                {/* Icon */}
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl ${colors.bg} ${colors.text} mb-6`}>
                  {step.icon}
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-white mb-1">{step.title}</h3>
                <p className={`text-sm ${colors.text} mb-3`}>{step.subtitle}</p>
                <p className="text-slate-400 text-sm leading-relaxed">{step.description}</p>

                {/* Connector arrow (not on last card) */}
                {step.number !== '03' && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <svg className="w-8 h-8 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
