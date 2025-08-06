import purgecss from "@fullhuman/postcss-purgecss";
import type { Config } from "postcss-load-config";

const config: Config = {
  plugins: [
    purgecss({
      content: ["./dist/**/*.html"],
      variables: true,
    }),
  ],
};

export default config;
