#!/bin/sh
set -e

# Ensure static directories exist (will use volume if mounted, otherwise create)
# This is a no-op if volumes are mounted, but ensures dirs exist for non-mounted case
if [ ! -d /app/static/audios ]; then
    mkdir -p /app/static/audios /app/static/avatars /app/static/images /app/static/videos /app/static/uploads 2>/dev/null || true
fi

# Execute the main command
exec "$@"

