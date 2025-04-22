#!/usr/bin/env python3

from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer, test


class CustomHandler(SimpleHTTPRequestHandler):

	def end_headers(self):
		# add custom headers
		self.send_header("Access-Control-Allow-Origin", "*")
		self.send_header("Access-Control-Expose-Headers", "*")
		self.send_header("Cache-Control", "no-cache")
		self.send_header("Cross-Origin-Resource-Policy", "cross-origin")
		self.send_header("Timing-Allow-Origin", "*")
		super().end_headers()


if __name__ == '__main__':
	# mostly copied from http.server
	import argparse

	parser = argparse.ArgumentParser()
	parser.add_argument('port', action='store', default=8000, type=int, nargs='?', help='specify alternate port (default: 8000)')
	args = parser.parse_args()

	test(HandlerClass=CustomHandler, ServerClass=ThreadingHTTPServer, port=args.port, bind='127.0.0.1', protocol='HTTP/1.1')
