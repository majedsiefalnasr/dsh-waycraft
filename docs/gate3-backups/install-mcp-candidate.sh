#!/bin/sh
# Owner-run install of the MCP candidate (host + client) into the desktop profile.
# Quit DeepSeek Harness Desktop first. Backup: docs/gate3-backups/20261109-154518/
set -e
SRC="/Users/majedsiefalnasr/Documents/Work/DeepSeek Harness/dsh-majed"
DST="$HOME/.dsh/profiles/desktop/node_modules/dsh-waycraft"
cp "$SRC"/dist/mcp*.js "$DST/dist/"
cp "$SRC/dist/client.js" "$DST/dist/client.js"
cp "$SRC/client.js" "$DST/client.js"
cp "$SRC/cordis.patch.yml" "$DST/cordis.patch.yml"
mkdir -p "$DST/mcp/locale"
cp "$SRC/mcp/locale/en.json" "$SRC/mcp/locale/ar.json" "$DST/mcp/locale/"
# Add the ./mcp exports and locale file glob to the installed package.json (keeps its version).
node -e '
const fs=require("fs"),p=process.argv[1],j=JSON.parse(fs.readFileSync(p,"utf8"));
j.exports={...j.exports,"./mcp":"./dist/mcp.js","./mcp/locale/*.json":"./mcp/locale/*.json","./mcp/icon":"./icon.svg"};
j.files=Array.from(new Set([...(j.files||[]),"mcp/locale/*.json"]));
fs.writeFileSync(p,JSON.stringify(j,null,2)+"\n");
' "$DST/package.json"
echo "Installed. Start DSH Desktop, then Plugins > Waycraft > enable the MCP manager component, and reload."
