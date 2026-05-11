import React, { useState, useMemo } from 'react'
import Chart from './components/Chart'
import MarketReading from './components/MarketReading'
import SignalBadge from './components/SignalBadge'
import TimeframeSelector from './components/TimeframeSelector'
import { useMarketData } from './hooks/useMarketData'

const STATUS_COLORS = {
  connected: 'bg-buy',
  connecting: 'bg-wait animate-pulse',
  disconnected: 'bg-sell',
  error: 'bg-sell',
}

export default function App() {
  const [activeTimeframe, setActiveTimeframe] = useState('5m')
  const { analysis, status, lastUpdate } = useMarketData()

  const candles = useMemo(() => {
    return analysis?.candles?.[activeTimeframe] ?? []
  }, [analysis, activeTimeframe])

  const signal = analysis?.signal ?? 'WAIT'
  const mlConf = analysis?.ml_prediction?.confidence ?? null
  const mlAvail = analysis?.ml_prediction?.ml_available ?? false
  const currentPrice = analysis?.timeframes?.['5m']?.current_price

  const lastUpdateStr = lastUpdate
    ? lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '—'

  return (
    <div className="min-h-screen bg-bg flex flex-col" style={{ height: '100vh' }}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-gold/20 border border-gold/40 flex items-center justify-center">
            <span className="text-gold text-xs font-bold">C</span>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-text">Celestiq</h1>
            <p className="text-xs text-subtle mono">XAUUSD · Price Action</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {currentPrice && (
            <span className="mono text-lg font-semibold text-gold">
              ${currentPrice.toFixed(2)}
            </span>
          )}
          <SignalBadge signal={signal} confidence={mlConf} mlAvailable={mlAvail} />
          <div className="flex items-center gap-1.5 text-xs text-subtle">
            <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[status]}`} />
            <span className="capitalize">{status}</span>
          </div>
          <span className="text-xs text-muted mono">Updated {lastUpdateStr}</span>
        </div>
      </header>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chart area */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
            <TimeframeSelector active={activeTimeframe} onChange={setActiveTimeframe} />
            <span className="text-xs text-subtle mono">
              {candles.length > 0 ? `${candles.length} candles` : 'Loading...'}
            </span>
          </div>
          <div className="flex-1 relative">
            {candles.length > 0 ? (
              <Chart candles={candles} timeframe={activeTimeframe} />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-subtle text-sm">Loading {activeTimeframe} candles...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Analysis panel */}
        <aside className="w-80 shrink-0 border-l border-border flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-border shrink-0">
            <h2 className="text-sm font-semibold text-text">Market Reading</h2>
            <p className="text-xs text-subtle">Updated every candle close</p>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <MarketReading
              analysis={analysis}
              loading={!analysis && status === 'connecting'}
            />
          </div>
        </aside>
      </div>
    </div>
  )
}
