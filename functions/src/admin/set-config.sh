#!/bin/sh

if [[ $1 == "development" || $1 == "staging" || $1 == "production" ]];
  then
    echo "Unsetting config for ${1}"
    firebase functions:config:unset env
    echo "Unsetting for ${1} was ok :)"

    echo "Setting config for ${1}"
    firebase functions:config:set env="$(cat ./src/admin/env.${1}.json)"
    echo "Setting config for ${1} was ok :)"
    exit 0
  fi
