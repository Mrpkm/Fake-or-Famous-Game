#!/usr/bin/env python
"""game-ai-proxy.py - a tiny, safe gateway in front of local Ollama.

Why: the game (a static https site) needs to reach your local AI from another
network. This proxy is the piece you expose (via a tunnel) instead of Ollama:

  laptop (https github.io)  ->  https tunnel  ->  THIS proxy  ->  127.0.0.1:11434

What it adds over raw Ollama:
  * CORS headers so the browser game is allowed to call it.
  * An access KEY (so only people with the key can use your GPU).
  * Ollama stays bound to localhost — only this keyed proxy is public.

Stdlib only (runs on the embeddable Python). Forwards just the two endpoints the
game uses: GET /api/tags and POST /api/chat (plus /healthz).

Env vars:
  GAME_AI_KEY   shared secret the client must send (header X-Game-Key or ?key=).
                If empty, no key is required (fine for trusted LAN use).
  OLLAMA_URL    upstream Ollama (default http://127.0.0.1:11434).
  PROXY_PORT    port to listen on (default 11500).
"""
import json
import os
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

KEY        = os.environ.get("GAME_AI_KEY", "").strip()
OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://127.0.0.1:11434").rstrip("/")
PORT       = int(os.environ.get("PROXY_PORT", "11500"))

ALLOW_PATHS = {"/api/tags": "GET", "/api/chat": "POST"}


class Handler(BaseHTTPRequestHandler):
    # ---- shared helpers -----------------------------------------------------
    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, X-Game-Key")
        self.send_header("Access-Control-Max-Age", "86400")

    def _send(self, code, body=b"", ctype="application/json; charset=utf-8"):
        if isinstance(body, str):
            body = body.encode("utf-8")
        self.send_response(code)
        self._cors()
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        if body:
            self.wfile.write(body)

    def _authed(self):
        if not KEY:
            return True
        given = self.headers.get("X-Game-Key", "")
        if not given:
            given = (parse_qs(urlparse(self.path).query).get("key") or [""])[0]
        return given == KEY

    def _forward(self, method, path, payload=None):
        url = OLLAMA_URL + path
        req = urllib.request.Request(url, data=payload, method=method)
        if payload is not None:
            req.add_header("Content-Type", "application/json")
        try:
            with urllib.request.urlopen(req, timeout=600) as r:
                self._send(r.status, r.read())
        except urllib.error.HTTPError as e:        # upstream said no — relay it
            self._send(e.code, e.read())
        except Exception as e:                       # Ollama down / unreachable
            self._send(502, json.dumps({"error": f"AI upstream unreachable: {e}"}))

    # ---- routes -------------------------------------------------------------
    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self):
        route = urlparse(self.path).path
        if route == "/healthz":
            return self._send(200, json.dumps({"ok": True, "keyed": bool(KEY)}))
        if route == "/api/tags":
            if not self._authed():
                return self._send(401, json.dumps({"error": "bad or missing key"}))
            return self._forward("GET", "/api/tags")
        self._send(404, json.dumps({"error": "not found"}))

    def do_POST(self):
        route = urlparse(self.path).path
        if route != "/api/chat":
            return self._send(404, json.dumps({"error": "not found"}))
        if not self._authed():
            return self._send(401, json.dumps({"error": "bad or missing key"}))
        length = int(self.headers.get("Content-Length", "0") or "0")
        body = self.rfile.read(length) if length else b"{}"
        self._forward("POST", "/api/chat", body)

    def log_message(self, fmt, *args):
        print("[proxy] " + (fmt % args))


def main():
    srv = ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
    print(f"[proxy] gateway on http://0.0.0.0:{PORT}  ->  {OLLAMA_URL}")
    print(f"[proxy] key required: {'YES' if KEY else 'no (open — trusted LAN only)'}")
    print("[proxy] expose THIS port with a tunnel; keep Ollama on localhost. Ctrl+C to stop.")
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("\n[proxy] stopped.")


if __name__ == "__main__":
    main()
