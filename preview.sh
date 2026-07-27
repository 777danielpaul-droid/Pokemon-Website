#!/bin/bash
cd /Users/danielpaul/rondelldemo
npm run build
exec npx vite preview --port 5199 --host
