import urllib.request
import urllib.error

try:
    req = urllib.request.Request('http://127.0.0.1:8000/api/v1/ai/query', data=b'{"query":"Find"}', headers={'Content-Type': 'application/json'}, method='POST')
    print(urllib.request.urlopen(req).read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print(e.read().decode('utf-8'))
