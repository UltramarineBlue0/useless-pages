#!/usr/bin/env python3

import http.server


class CustomHandler(http.server.SimpleHTTPRequestHandler):
	# Switch to http1.1 when python can correctly handle persistent connection
	protocol_version = "HTTP/1.0"

	def end_headers(self):
		"""
		A hack to add custom headers. ACAO is needed for sandboxed iframes without allow-same-origin
		"""
		self.send_header("Access-Control-Allow-Origin", "*")
		self.send_header("Cache-Control", "public, max-age=90, must-revalidate")
		# self.send_header("Connection", "keep-alive")
		# self.send_header("Keep-Alive", "timeout=3, max=999")
		super().end_headers()


CustomHandler.extensions_map.update({
	'.wasm': 'application/wasm',
	'.mjs': 'text/javascript',
	'.js': 'text/javascript',
})


if __name__ == '__main__':
	# Partially copied from http.server
	server_address = ("127.0.0.1", 8000)
	with http.server.HTTPServer(server_address, CustomHandler) as httpd:
		print("Serving at http://127.0.0.1:8000/\n")
		try:
			httpd.serve_forever()
		except KeyboardInterrupt:
			print("\nKeyboard interrupt received, exiting.")
