#!/usr/bin/env python3
"""
Simple HTTP server for Franklink Marketing Website
Automatically opens the browser when started
"""

import http.server
import socketserver
import webbrowser
import os
import threading
import time

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Add headers to prevent caching during development
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        self.send_header('Expires', '0')
        super().end_headers()

def open_browser():
    """Open the browser after a short delay"""
    time.sleep(1)
    webbrowser.open(f'http://localhost:{PORT}')

def start_server():
    """Start the HTTP server"""
    os.chdir(DIRECTORY)

    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        print("=" * 50)
        print("Franklink Marketing Website Server")
        print("=" * 50)
        print(f"Serving directory: {DIRECTORY}")
        print(f"Server running at: http://localhost:{PORT}")
        print("=" * 50)
        print("Opening browser automatically...")
        print("Press Ctrl+C to stop the server")
        print("=" * 50)

        # Open browser in a separate thread
        threading.Thread(target=open_browser, daemon=True).start()

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n" + "=" * 50)
            print("Server stopped. Thanks for using Franklink!")
            print("=" * 50)

if __name__ == "__main__":
    start_server()