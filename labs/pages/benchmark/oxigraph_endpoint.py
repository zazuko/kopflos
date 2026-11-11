"""Optional native endpoint: pip install pyoxigraph==0.4.7 in a temporary venv."""
import gc
import json
import resource
import sys
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

import pyoxigraph as ox

scenario = json.loads(sys.argv[1])
store = ox.Store()
for identifier in range(scenario['resources']):
    route = identifier % scenario['routes']
    subject = ox.NamedNode(f'http://example.org/resource/type-{route}/{identifier}')
    store.add(ox.Quad(subject, ox.NamedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), ox.NamedNode('http://schema.org/Thing')))
    for prop in range(scenario['properties']):
        store.add(ox.Quad(subject, ox.NamedNode(f'urn:property:{prop}'), ox.Literal(f'value-{identifier}-{prop}')))
metrics = []


class Handler(BaseHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'
    disable_nagle_algorithm = True

    def log_message(self, *_args):
        pass

    def respond(self, body, media_type='application/json', status=200):
        self.send_response(status)
        self.send_header('Content-Type', media_type)
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        self.handle_query()

    def do_POST(self):
        self.handle_query()

    def handle_query(self):
        try:
            url = urlparse(self.path)
            if url.path == '/reset':
                gc.collect()
                metrics.clear()
                self.respond(b'{}')
                return
            if url.path == '/metrics':
                peak = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
                rss = peak if sys.platform == 'darwin' else peak * 1024
                self.respond(json.dumps({'requests': metrics, 'memory': {'rss': rss}, 'maxRssKiB': rss / 1024}).encode())
                return
            body = self.rfile.read(int(self.headers.get('Content-Length', 0))).decode()
            query = parse_qs(url.query).get('query', [None])[0]
            if query is None:
                query = body if self.headers.get('Content-Type', '').startswith('application/sparql-query') else parse_qs(body).get('query', [None])[0]
            if not query:
                self.respond(b'', 'text/turtle')
                return
            start, cpu = time.perf_counter(), time.process_time()
            result = store.query(query)
            if isinstance(result, ox.QueryTriples):
                data = result.serialize(format=ox.RdfFormat.N_TRIPLES)
                media_type = 'application/n-triples'
            else:
                data = result.serialize(format=ox.QueryResultsFormat.JSON)
                media_type = 'application/sparql-results+json'
            metrics.append({'query': query, 'bytes': len(data), 'cpuMs': (time.process_time() - cpu) * 1000, 'elapsedMs': (time.perf_counter() - start) * 1000})
            self.respond(data, media_type)
        except Exception as error:
            self.respond(str(error).encode(), 'text/plain', 500)


server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
print(json.dumps({'url': f'http://127.0.0.1:{server.server_port}/sparql', 'inputQuads': len(store), 'engine': f'Oxigraph {ox.__version__}'}), flush=True)
server.serve_forever()
