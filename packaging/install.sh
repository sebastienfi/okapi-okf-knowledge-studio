#!/usr/bin/env sh
# Install the Okapi prebuilt binary. Usage:
#   curl -fsSL https://raw.githubusercontent.com/sebastienfi/okapi-okf-knowledge-studio/main/packaging/install.sh | sh
set -eu

REPO="sebastienfi/okapi-okf-knowledge-studio"
BIN_DIR="${OKAPI_BIN_DIR:-/usr/local/bin}"

os="$(uname -s | tr '[:upper:]' '[:lower:]')"
arch="$(uname -m)"
case "$os" in
  darwin) plat="macos" ;;
  linux) plat="linux" ;;
  *) echo "Unsupported OS: $os (use npm: npm i -g okapi-okf)"; exit 1 ;;
esac
case "$arch" in
  x86_64|amd64) a="x64" ;;
  arm64|aarch64) a="arm64" ;;
  *) echo "Unsupported arch: $arch"; exit 1 ;;
esac

asset="okapi-${plat}-${a}"
url="https://github.com/${REPO}/releases/latest/download/${asset}"

echo "Downloading ${asset}…"
tmp="$(mktemp)"
curl -fsSL "$url" -o "$tmp"
chmod +x "$tmp"

if [ -w "$BIN_DIR" ]; then
  mv "$tmp" "$BIN_DIR/okapi"
else
  echo "Installing to $BIN_DIR (needs sudo)…"
  sudo mv "$tmp" "$BIN_DIR/okapi"
fi

echo "✓ Installed okapi to $BIN_DIR/okapi"
okapi --version
