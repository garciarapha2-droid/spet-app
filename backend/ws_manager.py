"""WebSocket connection manager for real-time updates across SPET modules."""
from fastapi import WebSocket
import logging
import asyncio
import json

logger = logging.getLogger(__name__)


class VenueWSManager:
    """Manages WebSocket connections per venue_id for real-time broadcasts."""

    def __init__(self):
        self._connections: dict[str, list[WebSocket]] = {}

    async def connect(self, venue_id: str, ws: WebSocket):
        await ws.accept()
        if venue_id not in self._connections:
            self._connections[venue_id] = []
        self._connections[venue_id].append(ws)
        logger.info(f"WS connected: venue={venue_id} (total={len(self._connections[venue_id])})")

    def disconnect(self, venue_id: str, ws: WebSocket):
        if venue_id in self._connections:
            self._connections[venue_id] = [c for c in self._connections[venue_id] if c is not ws]
            if not self._connections[venue_id]:
                del self._connections[venue_id]
        logger.info(f"WS disconnected: venue={venue_id}")

    async def broadcast(self, venue_id: str, event_type: str, payload: dict = None):
        """Broadcast an event to all connected clients for a venue."""
        conns = self._connections.get(venue_id, [])
        if not conns:
            return
        message = json.dumps({"type": event_type, "data": payload or {}})
        dead = []
        for ws in conns:
            try:
                await ws.send_text(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(venue_id, ws)


# Singleton instance
ws_manager = VenueWSManager()
