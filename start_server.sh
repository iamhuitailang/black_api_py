#!/bin/bash
cd /Users/sunmengmeng/works/solo-coder/github0611/061108
python3 -u -c "
import uvicorn
print('Starting server on port 8080...', flush=True)
uvicorn.run('main:app', host='0.0.0.0', port=8080, log_level='info')
"
