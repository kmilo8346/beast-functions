#!/bin/sh

if [[ $1 == "development" ]]
then
  echo "Unsetting config for ${1}"
  echo "Unsetting for ${1} was ok :)"

  echo "Setting config for ${1}"
  firebase functions:config:set elastic.username=elastic
  firebase functions:config:set elastic.password=changeme
  firebase functions:config:set elastic.node=http://localhost:9200
  firebase functions:config:set elastic.max_retries=3
  firebase functions:config:set elastic.request_timeout=6000

  firebase functions:config:set mercado_pago.access_token=APP_USR-1142675697693721-050822-1379fd4934746060d9a9dedbacf70030-178377231
  firebase functions:config:set mercado_pago.notification_url=https://cfeff1248944.ngrok.io/beast-development/us-central1/mercadopago-webhooks
  
  firebase functions:config:set google_pub_sub.topic_prefix=projects/beast-development/topics/
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