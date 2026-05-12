import React from 'react'

const CONFIG = {
  BUY:  { bg: 'bg-buy/20',  border: 'border-buy',  text: 'text-buy',  pulse: 'signal-buy',  icon: '▲' },
  SELL: { bg: 'bg-sell/20', border: 'border-sell', text: 'text-sell', pulse: 'signal-sell', icon: '▼' },
  WAIT: { bg: 'bg-wait/20', border: 'border-wait', text: 'text-wait', pulse: 'signal-wait', icon: '◆' },
}

export default function SignalBadge({ signal, confidence, mlAvailable }) {
  const cfg = CONFIG[signal] ?? CONFIG.WAIT
  const pct = confidence ? `${(confidence * 100).toFixed(0)}%` : null

  return (
    <div className={`inline-flex items-center gap-3 px-5 py-3 rounded-xl border ${cfg.bg} ${cfg.border} ${cfg.pulse}`}>
      <span className={`text-2xl font-bold mono ${cfg.text}`}>{cfg.icon} {signal}</span>
      {pct && (
        <div className="flex flex-col items-end">
          <span className="text-xs text-subtle">ML confidence</span>
          <span className={`text-sm font-semibold mono ${cfg.text}`}>{pct}</span>
        </div>
      )}
      {!mlAvailable && (
        <span className="text-xs text-subtle bg-surface px-2 py-0.5 rounded">rule-based</span>
      )}
    </div>
  )
}
