source "https://rubygems.org"

# ponytail: plugins: [] in _config.yml, so plain jekyll builds identically to
# GH Pages without the github-pages meta-gem's ~30 transitive deps.
# Local dev: `bundle install && bundle exec jekyll serve --baseurl ""`
# (baseurl "" needed because _config.yml sets baseurl: "/SocialLinker")
# ponytail: exact pin (was ~> 4.3) for reproducible local builds matching GH Pages runtime.
# Bump deliberately after verifying on the live branch.
gem "jekyll", "4.3.4"
