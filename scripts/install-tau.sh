#!/usr/bin/env bash
set -euo pipefail
# Run from the root of the Prolog-Made-Easy project.
if [[ ! -f assets/js/natural-worker.js ]]; then
  echo 'Run this script from the Prolog-Made-Easy repository root.' >&2
  exit 1
fi
npm install --no-save --package-lock=false --ignore-scripts tau-prolog@0.3.4
mkdir -p assets/vendor/tau-prolog
cp node_modules/tau-prolog/modules/core.js assets/vendor/tau-prolog/core.js
if [[ -f node_modules/tau-prolog/LICENSE ]]; then
  cp node_modules/tau-prolog/LICENSE assets/vendor/tau-prolog/LICENSE
elif [[ -f node_modules/tau-prolog/LICENSE.md ]]; then
  cp node_modules/tau-prolog/LICENSE.md assets/vendor/tau-prolog/LICENSE.md
fi
echo 'Installed local Tau Prolog at assets/vendor/tau-prolog/core.js'
