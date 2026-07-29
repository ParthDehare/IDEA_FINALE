import { useState, useEffect } from 'react';

/**
 * Custom hook managing robust WebSocket connection to `/ws/alerts`.
 * Handles live transaction ingestion, exponential backoff reconnection,
 * and state syncing across multiple dashboard elements.
 */
export function useWebSocketAlerts({
  autoRefresh = true,
  isAuthenticated = true,
  normalizeTransaction,
  setScoredTxns,
  setActiveFraudAlert,
  MAX_TRANSACTIONS = 10000
}) {
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    if (!autoRefresh || !isAuthenticated) {
      setWsConnected(false);
      return;
    }

    let ws = null;
    let reconnectTimeout = null;
    let isMounted = true;
    let reconnectAttempts = 0;

    const connect = () => {
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const isDevServer = isLocal && window.location.port !== '' && window.location.port !== '80';
      const wsHost = isDevServer
        ? 'localhost:8000'
        : (isLocal ? window.location.host : (import.meta.env.VITE_API_DOMAIN || 'api.vaultmind.systems'));
      const wsProto = isLocal ? 'ws:' : 'wss:';

      try {
        ws = new WebSocket(`${wsProto}//${wsHost}/ws/alerts`);
      } catch (e) {
        console.error("[useWebSocketAlerts] Connection instantiation failed:", e);
        scheduleReconnect();
        return;
      }

      ws.onopen = () => {
        if (!isMounted) {
          ws.close();
          return;
        }
        console.log("🟢 [useWebSocketAlerts] Connected to WebSocket for live alerts");
        setWsConnected(true);
        reconnectAttempts = 0; // Reset backoff counter on success
      };

      ws.onmessage = (event) => {
        try {
          const rawData = JSON.parse(event.data);

          // Handle special analyst feedback events or metadata broadcasts
          if (rawData.event_type === 'ANALYST_FEEDBACK_LOGGED') {
            console.log("📢 Analyst feedback event received:", rawData);
            return;
          }

          const normalized = normalizeTransaction ? normalizeTransaction(rawData) : rawData;
          if (normalized) {
            setScoredTxns((prev) => {
              const currentList = Array.isArray(prev) ? prev : [];
              return [...currentList, normalized].slice(-MAX_TRANSACTIONS);
            });

            if (normalized.cbsi >= 70 && setActiveFraudAlert) {
              setActiveFraudAlert(normalized);
            }
          }
        } catch (err) {
          console.error("[useWebSocketAlerts] Error processing incoming WebSocket message:", err);
        }
      };

      ws.onerror = (err) => {
        console.error("[useWebSocketAlerts] WebSocket error:", err);
      };

      ws.onclose = () => {
        console.log("🔴 [useWebSocketAlerts] WebSocket disconnected");
        setWsConnected(false);
        if (isMounted && autoRefresh) {
          scheduleReconnect();
        }
      };
    };

    const scheduleReconnect = () => {
      // Exponential backoff: 3s, 6s, 12s, max capped at 30s
      const delay = Math.min(3000 * Math.pow(2, reconnectAttempts), 30000);
      console.log(`🔄 [useWebSocketAlerts] Reconnecting in ${delay / 1000}s (attempt ${reconnectAttempts + 1})...`);
      reconnectAttempts++;
      clearTimeout(reconnectTimeout);
      reconnectTimeout = setTimeout(connect, delay);
    };

    connect();

    return () => {
      isMounted = false;
      setWsConnected(false);
      clearTimeout(reconnectTimeout);
      if (ws) {
        ws.onclose = null; // Prevent reconnect loop triggered by component unmount
        if (ws.readyState === 1) {
          ws.close();
        } else if (ws.readyState === 0) {
          ws.onopen = () => ws.close();
        } else {
          ws.close();
        }
      }
    };
  }, [autoRefresh, isAuthenticated, normalizeTransaction, setScoredTxns, setActiveFraudAlert, MAX_TRANSACTIONS]);

  return { wsConnected };
}
