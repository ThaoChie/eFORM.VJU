#!/bin/bash
set -e

echo "Generating dev keystore (PKCS12)..."
KEYSTORE_PASS="changeit"
KEY_ALIAS="demo_signer"
KEYSTORE_FILE="/tmp/demo_keystore.p12"

rm -f $KEYSTORE_FILE
keytool -genkeypair -alias "$KEY_ALIAS" -keyalg RSA -keysize 2048 -storetype PKCS12 -keystore "$KEYSTORE_FILE" -validity 3650 -storepass "$KEYSTORE_PASS" -dname "CN=Demo Signer, OU=Demo, O=Demo Org, L=Hanoi, ST=Hanoi, C=VN"

echo "Keystore created."
echo ""
echo "KEYSTORE_PASSWORD: $KEYSTORE_PASS"
echo "KEY_ALIAS: $KEY_ALIAS"
echo "KEYSTORE_BASE64 (Copy the string below):"
base64 -i "$KEYSTORE_FILE" | tr -d '\n'
echo ""
