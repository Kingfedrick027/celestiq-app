import { useState, useEffect, useRef, useCallback } from 'react'

const WS_URL = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`
const RECONNECT_DELAY = 3000

export function useMarketData() {
  const [analysis, setAnalysis] = useState(null)
  const [status, setStatus] = useState('connecting') // connecting | connected | disconnected | error
  const [lastUpdate, setLastUpdate] = useState(null)
  const wsRef = useRef(null)
  const reconnectTimer = useRef(null)
  const mountedRef = useRef(true)

  const connect = useCallback(() => {
    if (!mountedRef.current) return

    setStatus('connecting')
    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen = () => {
      if (!mountedRef.current) return
      setStatus('connected')
    }

    ws.onmessage = (event) => {
      if (!mountedRef.current) return
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'ping') return
        if (data.type === 'analysis' || data.timeframes) {
          setAnalysis(data)
          setLastUpdate(new Date())
        }
      } catch (e) {
        console.error('WS parse error', e)
      }
    }

    ws.onclose = () => {
      if (!mountedRef.current) return
      setStatus('disconnected')
      reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY)
    }

    ws.onerror = () => {
      if (!mountedRef.current) return
      setStatus('error')
      ws.close()
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    connect()

    // Also fetch immediately via REST as fallback
    fetch('/api/analyze')
      .then(r => r.json())
      .then(data => {
        if (mountedRef.current && data.timeframes) {
          setAnalysis(data)
          setLastUpdate(new Date())
        }
      })
      .catch(() => {})

    return () => {
      mountedRef.current = false
      clearTimeout(reconnectTimer.current)
      wsRef.current?.close()
    }
  }, [connect])

  return { analysis, status, lastUpdate }
}
