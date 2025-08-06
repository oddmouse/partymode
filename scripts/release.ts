#!/usr/bin/env tsx

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync("./package.json", "utf8"));
const dest = `./release/webinterface.partymode-${pkg.version}.zip`;

execSync(
  `
    pnpm build && \
    rm -rf ./release/ && \
    mkdir ./release/ && \
    zip -r -9 ${dest} ./dist/
  `,
  {
    stdio: "inherit",
  },
);
