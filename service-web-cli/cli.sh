#!/usr/bin/env bash

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

"${SCRIPT_DIR}/../node_modules/.bin/ts-node"  "${SCRIPT_DIR}/src/cli.ts" $@
