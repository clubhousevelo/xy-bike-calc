from http.server import HTTPServer, SimpleHTTPRequestHandler
import os

class CORSRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        return super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()
        
    def guess_type(self, path):
        # Add support for .db files
        if path.endswith('.db'):
            return 'application/x-sqlite3'
        return super().guess_type(path)

def run(server_class=HTTPServer, handler_class=CORSRequestHandler, port=8000):
    # Change to the bike-calculator directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    server_address = ('', port)
    httpd = server_class(server_address, handler_class)
    print(f"Server running at http://localhost:{port}/")
    print(f"Serving files from: {os.getcwd()}")
    httpd.serve_forever()

if __name__ == '__main__':
    run() 