#!/bin/bash

BRANCHES=("production" "development" "preview")
UUIDS_FILE="updates_to_delete.txt"

> "$UUIDS_FILE"

echo "=== Coletando updates ==="
for BRANCH in "${BRANCHES[@]}"; do
  echo "Listando branch: $BRANCH..."
  TMPFILE=$(mktemp)
  NO_COLOR=1 eas update:list --branch "$BRANCH" > "$TMPFILE" 2>/dev/null
  grep -oE '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' "$TMPFILE" | tail -n +2 >> "$UUIDS_FILE"
  rm "$TMPFILE"
done

echo "Total: $(wc -l < "$UUIDS_FILE") updates"
echo ""
echo "=== Deletando em paralelo ==="

# Deleta até 5 ao mesmo tempo
cat "$UUIDS_FILE" | xargs -P 5 -I {} sh -c 'echo ">> Deletando: {}" && eas update:delete {} --non-interactive'

rm "$UUIDS_FILE"
echo ""
echo "Tudo limpo!"