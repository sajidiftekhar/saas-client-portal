#!/usr/bin/env bash
set -euo pipefail

cleanup() {
  supabase stop --no-backup >/dev/null 2>&1 || true
}

trap cleanup EXIT

echo "Starting local Supabase stack..."
supabase start

echo "Resetting local database (migrations + seed)..."
supabase db reset --local

echo "Resolving local DB connection string..."
DB_URL="$(supabase status -o env | sed -n 's/^DB_URL=//p')"

if [[ -z "${DB_URL}" ]]; then
  echo "Failed to read DB_URL from 'supabase status -o env'."
  exit 1
fi

echo "Running RLS SQL test plan..."
psql "${DB_URL}" -v ON_ERROR_STOP=1 -f supabase/tests/rls_test_plan.sql

echo "RLS test plan completed successfully."
