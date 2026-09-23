#!/bin/sh
# Renders alertmanager.yml from .env values, then starts Alertmanager.
set -eu

TEMPLATE=/etc/alertmanager/alertmanager.yml
CONFIG=/alertmanager/alertmanager.rendered.yml

# A Windows checkout can give the template CRLF endings; strip them first so
# the "# email-only" markers still match.
if [ -n "${ALERT_EMAIL_TO:-}" ]; then
  : "${ALERT_EMAIL_FROM:?ALERT_EMAIL_FROM must be set when ALERT_EMAIL_TO is}"
  : "${ALERT_SMTP_PASSWORD:?ALERT_SMTP_PASSWORD must be set when ALERT_EMAIL_TO is}"
  (umask 077 && printf '%s' "$ALERT_SMTP_PASSWORD" > /tmp/smtp_password)
  sed -e 's/\r$//' \
      -e "s|__ALERT_EMAIL_TO__|${ALERT_EMAIL_TO}|g" \
      -e "s|__ALERT_EMAIL_FROM__|${ALERT_EMAIL_FROM}|g" \
      -e "s|__ALERT_SMTP_HOST__|${ALERT_SMTP_HOST:-smtp.gmail.com:587}|g" \
      "$TEMPLATE" > "$CONFIG"
  echo "Alert emails go to ${ALERT_EMAIL_TO} via ${ALERT_SMTP_HOST:-smtp.gmail.com:587}"
else
  sed -e 's/\r$//' -e '/# email-only$/d' "$TEMPLATE" > "$CONFIG"
  echo "ALERT_EMAIL_TO is not set: alerts are shown in the UI only, no email is sent"
fi

exec /bin/alertmanager --config.file="$CONFIG" --storage.path=/alertmanager "$@"
