#!/usr/bin/env bash
# Ensures local repo is linked to 605b-ai project before deploy.
# Fails if linked to creditclear-app or any other project.
set -e
CONFIG=".vercel/project.json"
if [[ ! -f "$CONFIG" ]]; then
  echo "[vercel-guard] .vercel/project.json not found. Run: vercel link --scope 605b-ai --project 605b-ai"
  exit 1
fi
PROJECT=$(node -e "const c=require('./$CONFIG'); if(!c.projectId||!c.orgId){process.exit(1);} process.stdout.write(c.projectName||'')")
if [[ "$PROJECT" != "605b-ai" ]]; then
  echo "[vercel-guard] Linked project is '$PROJECT', expected '605b-ai'. Run: vercel link --scope 605b-ai --project 605b-ai"
  exit 1
fi
echo "[vercel-guard] OK: linked to 605b-ai"
