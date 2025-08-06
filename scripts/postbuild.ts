#!/usr/bin/env tsx

import { execSync } from "node:child_process";
import { copyFileSync, readFileSync, writeFileSync } from "node:fs";

const readme = readFileSync("README.md", "utf8");
const fixed = readme.replace(/public\/resources\//g, "resources/");
writeFileSync("dist/README.md", fixed);
copyFileSync("LICENSE.txt", "dist/LICENSE.txt");
execSync('find dist -name ".DS_Store" -delete', { stdio: "inherit" });
