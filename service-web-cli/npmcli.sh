#!/usr/bin/env bash

SCRIPT_DIR="$( cd "$( dirname $( realpath "${BASH_SOURCE[0]}" ) )" && pwd )"

node "${SCRIPT_DIR}/../dist/commonjs/service-web-cli/src/cli.js" $@
