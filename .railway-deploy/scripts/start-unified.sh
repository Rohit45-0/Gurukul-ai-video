#!/bin/sh
set -eu

if [ "${USE_EMBEDDED_POSTGRES:-false}" = "true" ]; then
  PGDATA_DIR="${EMBEDDED_PGDATA:-/tmp/gurukul-postgres}"
  mkdir -p "$PGDATA_DIR"
  mkdir -p /run/postgresql
  chown -R postgres:postgres "$PGDATA_DIR"
  chown -R postgres:postgres /run/postgresql
  chmod 700 "$PGDATA_DIR"

  if [ ! -f "$PGDATA_DIR/PG_VERSION" ]; then
    su postgres -c "initdb -D '$PGDATA_DIR' --auth=trust" >/dev/null
    {
      echo "listen_addresses = '127.0.0.1'"
      echo "port = 5432"
      echo "unix_socket_directories = '/run/postgresql'"
    } >> "$PGDATA_DIR/postgresql.conf"
  fi

  rm -f "$PGDATA_DIR/postmaster.pid"
  if ! su postgres -c "pg_ctl -D '$PGDATA_DIR' -l '$PGDATA_DIR/server.log' -w start"; then
    cat "$PGDATA_DIR/server.log" || true
    exit 1
  fi

  EXISTING_DB="$(su postgres -c "psql -h 127.0.0.1 -p 5432 -d postgres -tAc \"SELECT 1 FROM pg_database WHERE datname='gurukul'\"")"
  if [ "$EXISTING_DB" != "1" ]; then
    su postgres -c "createdb -h 127.0.0.1 -p 5432 gurukul"
  fi

  export DATABASE_URL="postgresql://postgres@127.0.0.1:5432/gurukul?schema=public"
fi

npm run prisma:migrate:deploy --workspace @community-ai/api
exec node apps/api/dist/src/main.js
