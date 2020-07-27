#!/bin/sh

if [[ $1 == "development" ]]
then
  echo "Unsetting config for ${1}"
  firebase functions:config:unset env
  echo "Unsetting for ${1} was ok :)"

  echo "Setting config for ${1}"
  firebase functions:config:set env="$(cat ./src/admin/env.development.json)"
  echo "Setting config for ${1} was ok :)"
  exit 0
fi

if [[ $1 == "staging" ]]
then
  echo "Not implement yet for environment ${1}"
  exit 0
fi

if [[ $1 == "production" ]]
then
  echo "Not implement yet for environment ${1}"
  exit 0
fi


echo "Envirnonmet ${1} not mapped";
exit 1