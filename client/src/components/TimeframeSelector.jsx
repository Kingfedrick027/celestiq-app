import React from 'react'

const TIMEFRAMES = ['5m', '15m', '1h', '4h']

export default function TimeframeSelector({ active, onChange }) {
  return (
    <div className="flex gap-1 bg-surface rounded-lg p-1 border border-border">
      {TIMEFRAMES.map(tf => (
        <button
          key={tf}
          onClick={() => onChange(tf)}
          className={`px-4 py-1.5 rounded-md text-sm font-medium mono transition-all ${
            active === tf
              ? 'bg-gold/20 text-gold border border-gold/40'
              : 'text-subtle hover:text-text hover:bg-border'
          }`}
        >
          {tf}
        </button>
      ))}
    </div>
  )
}
