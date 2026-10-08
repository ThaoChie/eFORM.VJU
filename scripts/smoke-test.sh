#!/bin/bash
set -e

if [ "$#" -ne 6 ]; then
    echo "Usage: $0 <FRONTEND_URL> <BACKEND_URL> <PYTHON_URL> <INTERNAL_API_KEY> <DEMO_ADMIN_EMAIL> <DEMO_SEED_PASSWORD>"
    exit 1
fi

FRONTEND_URL=$1
BACKEND_URL=$2
PYTHON_URL=$3
INTERNAL_API_KEY=$4
DEMO_ADMIN_EMAIL=$5
DEMO_SEED_PASSWORD=$6

echo "1. Testing BACKEND warmup endpoint..."
curl -f -s --max-time 180 "$BACKEND_URL/api/v1/system/warmup" | grep '"status":"UP"' || (echo "Backend warmup failed" && exit 1)
echo "Backend warmup passed."

echo "2. Testing PYTHON health endpoint..."
curl -f -s --max-time 180 "$PYTHON_URL/health" | grep '{"status":"ok"}' || (echo "Python health failed" && exit 1)
echo "Python health passed."

echo "3. Testing PYTHON endpoint without auth key..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$PYTHON_URL/some_endpoint")
if [ "$HTTP_STATUS" -ne 401 ] && [ "$HTTP_STATUS" -ne 404 ]; then
    echo "Expected 401 or 404, got $HTTP_STATUS"
    exit 1
fi
echo "Python endpoint protected."

echo "4. Testing CORS preflight..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS -H "Origin: $FRONTEND_URL" -H "Access-Control-Request-Method: POST" "$BACKEND_URL/api/v1/auth/login")
if [ "$HTTP_STATUS" -ne 200 ] && [ "$HTTP_STATUS" -ne 204 ]; then
    echo "CORS preflight failed with $HTTP_STATUS"
    exit 1
fi
echo "CORS preflight passed."

echo "5. Testing Login & Me..."
LOGIN_RES=$(curl -s -X POST -H "Content-Type: application/json" -d "{\"email\":\"$DEMO_ADMIN_EMAIL\",\"password\":\"$DEMO_SEED_PASSWORD\"}" "$BACKEND_URL/api/v1/auth/login")
TOKEN=$(echo "$LOGIN_RES" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
if [ -z "$TOKEN" ]; then
    echo "Login failed."
    exit 1
fi
ME_RES=$(curl -s -H "Authorization: Bearer $TOKEN" "$BACKEND_URL/api/v1/auth/me")
echo "$ME_RES" | grep '"email"' > /dev/null || (echo "Me endpoint failed" && exit 1)
echo "Login & Me passed."

echo "6. Testing file upload..."
echo "dummy image" > /tmp/dummy.png
UPLOAD_RES=$(curl -s -X POST -H "Authorization: Bearer $TOKEN" -F "file=@/tmp/dummy.png;type=image/png" "$BACKEND_URL/api/v1/storage/upload?bucket=proofs")
echo "$UPLOAD_RES" | grep '"url"' > /dev/null || (echo "Upload failed" && exit 1)
echo "Upload passed."

echo "All tests passed!"
