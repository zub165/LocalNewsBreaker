#!/usr/bin/env bash
# Release build with store compliance verification.
set -euo pipefail

cd "$(dirname "$0")/.."
API_URL="${API_BASE_URL:-https://citizen-api.mywaitime.com}"

echo "Running store compliance check..."
bash tool/verify_store_compliance.sh

echo "Building Android App Bundle..."
bash ../tool/update_public_feed.sh || true
flutter build appbundle --release --dart-define=API_BASE_URL="$API_URL"

echo "Building iOS IPA..."
flutter build ipa --release --dart-define=API_BASE_URL="$API_URL"

echo "Done."
echo "  AAB: build/app/outputs/bundle/release/app-release.aab"
echo "  IPA: build/ios/ipa/local_news_breaker.ipa"
