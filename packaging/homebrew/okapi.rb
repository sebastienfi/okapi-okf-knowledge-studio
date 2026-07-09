# Template Homebrew formula. Lives in the tap repo `okf-tools/homebrew-tap`
# as `Formula/okapi.rb`; the release pipeline updates `version`/`url`/`sha256`.
class Okapi < Formula
  desc "OKF Knowledge Studio — visualize, audit, edit and query OKF bundles"
  homepage "https://github.com/okf-tools/okapi"
  version "0.1.0"
  license "MIT"

  on_macos do
    on_arm do
      url "https://github.com/okf-tools/okapi/releases/download/v#{version}/okapi-macos-arm64"
      sha256 "REPLACED_AT_RELEASE"
    end
    on_intel do
      url "https://github.com/okf-tools/okapi/releases/download/v#{version}/okapi-macos-x64"
      sha256 "REPLACED_AT_RELEASE"
    end
  end

  on_linux do
    on_arm do
      url "https://github.com/okf-tools/okapi/releases/download/v#{version}/okapi-linux-arm64"
      sha256 "REPLACED_AT_RELEASE"
    end
    on_intel do
      url "https://github.com/okf-tools/okapi/releases/download/v#{version}/okapi-linux-x64"
      sha256 "REPLACED_AT_RELEASE"
    end
  end

  def install
    bin.install Dir["okapi-*"].first => "okapi"
  end

  test do
    assert_match "okapi", shell_output("#{bin}/okapi --version")
  end
end
