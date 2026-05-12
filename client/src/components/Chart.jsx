import React, { useEffect, useRef } from 'react'
import { createChart } from 'lightweight-charts'

export default function Chart({ candles, timeframe }) {
  const containerRef = useRef(null)
  const chartRef = useRef(null)
  const seriesRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return

    chartRef.current = createChart(containerRef.current, {
      layout: {
        background: { color: '#141720' },
        textColor: '#8892a4',
      },
      grid: {
        vertLines: { color: '#1e2330' },
        horzLines: { color: '#1e2330' },
      },
      crosshair: {
        mode: 1,
        vertLine: { color: '#3a4055', labelBackgroundColor: '#1e2330' },
        horzLine: { color: '#3a4055', labelBackgroundColor: '#1e2330' },
      },
      rightPriceScale: {
        borderColor: '#1e2330',
      },
      timeScale: {
        borderColor: '#1e2330',
        timeVisible: true,
        secondsVisible: false,
      },
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
    })

    seriesRef.current = chartRef.current.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    })

    const resizeObserver = new ResizeObserver(() => {
      if (chartRef.current && containerRef.current) {
        chartRef.current.resize(
          containerRef.current.clientWidth,
          containerRef.current.clientHeight
        )
      }
    })
    resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
      chartRef.current?.remove()
    }
  }, [])

  useEffect(() => {
    if (!seriesRef.current || !candles?.length) return

    const sorted = [...candles]
      .filter(c => c.time && c.open && c.high && c.low && c.close)
      .sort((a, b) => a.time - b.time)

    seriesRef.current.setData(sorted)
    chartRef.current?.timeScale().fitContent()
  }, [candles])

  return (
    <div ref={containerRef} className="tv-chart w-full h-full" />
  )
}
