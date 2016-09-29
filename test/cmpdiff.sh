#!/bin/bash
# -*- coding: utf-8, tab-width: 2 -*-


function cmpdiff () {
  local TEXTS="$(grep -xFe '//!' -m 1 -A 5 -- "${1:-test.js}" \
    | grep -Pe '^\s*(a|b|opt)\s*=' -m 3)"
  if [ -n "$TEXTS" ]; then
    echo "I: found grep mark in test file."
  else
    tty --quiet && echo "I: gonna read a=/b=/opt= from stdin."
    TEXTS="$(grep -Fe '=' -m 3)"
  fi
  local OPT="$(<<<"$TEXTS" sed -nre 's~^[^=]*\b(opt)\s*=~~p')"
  local UNIF="$(<<<"$OPT" grep -oPe ' unified: \d+,? ' | tr -cd 0-9)"
  TEXTS="$(<<<"$TEXTS" sed -re '
    /\b(opt)\b\s*=/d
    /[A-Za-z]/!d
    s~[^=\x27\x22]*=[^=\x27\x22]*[\x27\x22]~~
    s~[\x27\x22]\)*,*;?$~~
    ')"
  diff -sU "${UNIF:-0}" <(<<<"${TEXTS%%$'\n'*}" tr -s ' ' '\n'
    ) <(<<<"${TEXTS#*$'\n'}" tr -s ' ' '\n'
    ) | colordiff | sed -ure '1d;2d;s~^~  \x27~;s~$~\x27,~'
  return 0
}










[ "$1" == --lib ] && return 0; cmpdiff "$@"; exit $?
