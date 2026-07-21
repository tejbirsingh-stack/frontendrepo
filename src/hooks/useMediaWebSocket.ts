import { useEffect, useRef, useCallback } from 'react';
import { env } from '../config/env';
import type { AnnotationHistoryEntry } from '../types/annotationHistory';

export type WebSocketMessage =
  | { type: 'REQUEST_SYNC' }
  | { type: 'SYNC_STATE'; payload: AnnotationHistoryEntry[] }
  | { type: 'NEW_ANNOTATION'; payload: AnnotationHistoryEntry };

export function useMediaWebSocket (
    mediaId : string | undefined,
    onMessage: (msg: WebSocketMessage) => void
) {
    const wsRef = useRef<WebSocket | null>(null);
    useEffect(() => {
        if (!mediaId) return;

        // Convert http(s):// to ws(s):// for WebSockets
        const defaultBase = typeof window !== 'undefined' ? `${window.location.origin}/api` : 'http://localhost:3000/api';
        const baseUrl = env.apiBaseUrl || defaultBase;
        const wsBase = baseUrl.replace(/^http/, 'ws'); 

        // Connect to backend realTime controller room for this specific media
        const wsUrl = `${wsBase}/ws?mediaId=${mediaId}`;

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        // Route incoming messages to the parent component
        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data) as WebSocketMessage;
                onMessage(data);
            } catch (err) {
                console.error('Failed to parse WS message', err);
            }
        };

        // Auto-cleanup to prevent memory leaks when user navigates away
        return () => {
        ws.close();
        wsRef.current = null;
        };
    }, [mediaId, onMessage]);

    // Function to let the VideoPlayer broadcast to the room
    const broadcastMessage = useCallback((message: WebSocketMessage) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(message));
        }
    }, []);

    return { broadcastMessage };
}