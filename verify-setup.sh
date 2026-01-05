#!/bin/bash

# Native Share Integration Setup Verification
# This script checks if all files are in place and properly configured

echo "🔍 Verifying Native Share Integration..."
echo ""

# Check mobile app files
echo "📱 Mobile App Files:"
if [ -f "../bansgavsandesh-webview-app/AdvancedWebView.js" ]; then
  echo "✅ AdvancedWebView.js"
else
  echo "❌ AdvancedWebView.js missing"
fi

if [ -f "../bansgavsandesh-webview-app/DeepLinkHandler.js" ]; then
  echo "✅ DeepLinkHandler.js"
else
  echo "❌ DeepLinkHandler.js missing"
fi

if [ -f "../bansgavsandesh-webview-app/app.json" ]; then
  echo "✅ app.json"
else
  echo "❌ app.json missing"
fi

echo ""
echo "🌐 Website Files:"

# Check website files
if [ -f "src/lib/native-share-bridge.ts" ]; then
  echo "✅ native-share-bridge.ts"
else
  echo "❌ native-share-bridge.ts missing"
fi

if [ -f "src/hooks/useNativeShare.ts" ]; then
  echo "✅ useNativeShare.ts"
else
  echo "❌ useNativeShare.ts missing"
fi

if [ -f "src/components/shared/ShareButton.tsx" ]; then
  echo "✅ ShareButton.tsx"
else
  echo "❌ ShareButton.tsx missing"
fi

# Check if ShareButton is imported in PostCard
if grep -q "ShareButton" "src/components/posts/PostCard.tsx" 2>/dev/null; then
  echo "✅ PostCard integrated"
else
  echo "❌ PostCard not integrated"
fi

# Check if ShareButton is imported in PostDetail
if grep -q "ShareButton" "src/components/post/PostDetail.tsx" 2>/dev/null; then
  echo "✅ PostDetail integrated"
else
  echo "❌ PostDetail not integrated"
fi

# Check .well-known files
echo ""
echo "🔗 Deep Linking Config:"
if [ -f "public/.well-known/apple-app-site-association" ]; then
  echo "✅ apple-app-site-association"
else
  echo "❌ apple-app-site-association missing"
fi

if [ -f "public/.well-known/assetlinks.json" ]; then
  echo "✅ assetlinks.json"
else
  echo "❌ assetlinks.json missing"
fi

echo ""
echo "📚 Documentation:"
if [ -f "NATIVE_SHARE_INTEGRATION.md" ]; then
  echo "✅ Integration Guide"
else
  echo "❌ Integration Guide missing"
fi

if [ -f "../bansgavsandesh-webview-app/DEEP_LINKING_GUIDE.md" ]; then
  echo "✅ Deep Linking Guide"
else
  echo "❌ Deep Linking Guide missing"
fi

echo ""
echo "✨ Setup verification complete!"
echo ""
echo "📝 Next Steps:"
echo "1. Update YOUR_TEAM_ID in public/.well-known/apple-app-site-association"
echo "2. Update YOUR_SHA256_FINGERPRINT in public/.well-known/assetlinks.json"
echo "3. Run 'npm run dev' to test on localhost"
echo "4. Build mobile app with 'eas build'"
echo "5. Test deep linking and native sharing"
echo ""
