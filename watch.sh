# Export all env vars
set -o allexport
source .env
set +o allexport

make watch