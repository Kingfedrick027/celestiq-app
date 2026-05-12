import React from 'react'

function PatternTag({ pattern }) {
  const dirColors = {
    bullish: 'text-buy border-buy/30 bg-buy/10',
    bearish: 'text-sell border-sell/30 bg-sell/10',
    neutral: 'text-wait border-wait/30 bg-wait/10',
  }
  const cls = dirColors[pattern.direction] ?? dirColors.neutral
  return (
    <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded border mono ${cls}`}>
      {pattern.name.replace(/_/g, ' ')}
    </span>
  )
}

function TimeframeRow({ tf, data }) {
  if (!data || data.error) return null
  const trend = data.trend?.trend ?? 'ranging'
  const strength = data.trend?.strength ?? ''
  const trendColor = trend === 'uptrend' ? 'text-buy' : trend === 'downtrend' ? 'text-sell' : 'text-wait'
  const allPatterns = [...(data.candlestick_patterns ?? []), ...(data.chart_patterns ?? [])]
  const price = data.current_price?.toFixed(2)

  return (
    <div className="flex items-start gap-3 py-2 border-b border-border last:border-0">
      <span className="mono text-gold font-semibold w-8 shrink-0 pt-0.5">{tf}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`mono text-sm font-semibold ${trendColor}`}>{trend}</span>
          {strength && <span className="text-xs text-subtle">({strength})</span>}
          {price && <span className="mono text-xs text-subtle">@ {price}</span>}
        </div>
        {allPatterns.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {allPatterns.slice(0, 3).map((p, i) => <PatternTag key={i} pattern={p} />)}
          </div>
        )}
        {data.level_context?.at_level && (
          <p className="text-xs text-gold mt-1">At key level</p>
        )}
      </div>
    </div>
  )
}

export default function MarketReading({ analysis, loading }) {
  if (loading) {
    return (
      <div className="flex flex-col gap-3 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-10 bg-border rounded" />
        ))}
      </div>
    )
  }

  if (!analysis) {
    return (
      <p className="text-subtle text-sm">Waiting for market data...</p>
    )
  }

  const narrative = analysis.narrative?.reading ?? ''
  const confluenceScore = analysis.confluence_score ?? 0
  const bias = analysis.overall_bias ?? 'neutral'
  const biasColor = bias === 'bullish' ? 'text-buy' : bias === 'bearish' ? 'text-sell' : 'text-wait'
  const timeframes = analysis.timeframes ?? {}

  return (
    <div className="flex flex-col gap-4">
      {/* AI Narrative */}
      {narrative && (
        <div className="bg-surface/50 border border-border rounded-lg p-4">
          <p className="text-xs text-subtle uppercase tracking-wider mb-2 font-medium">AI Reading</p>
          <p className="text-sm text-text leading-relaxed whitespace-pre-wrap">{narrative}</p>
        </div>
      )}

      {/* Confluence + Bias */}
      <div className="flex items-center gap-4">
        <div>
          <p className="text-xs text-subtle">Overall Bias</p>
          <p className={`font-semibold capitalize ${biasColor}`}>{bias}</p>
        </div>
        <div className="flex-1">
          <p className="text-xs text-subtle mb-1">Confluence</p>
          <div className="h-1.5 bg-border rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                bias === 'bullish' ? 'bg-buy' : bias === 'bearish' ? 'bg-sell' : 'bg-wait'
              }`}
              style={{ width: `${confluenceScore * 100}%` }}
            />
          </div>
          <p className="text-xs text-subtle text-right mt-0.5 mono">{(confluenceScore * 100).toFixed(0)}%</p>
        </div>
      </div>

      {/* Per-timeframe breakdown */}
      <div>
        <p className="text-xs text-subtle uppercase tracking-wider mb-2 font-medium">Timeframe Breakdown</p>
        <div className="bg-surface/50 border border-border rounded-lg px-4 py-1">
          {['4h', '1h', '15m', '5m'].map(tf => (
            <TimeframeRow key={tf} tf={tf} data={timeframes[tf]} />
          ))}
        </div>
      </div>
    </div>
  )
}
