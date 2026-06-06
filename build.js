require("esbuild").build({
  entryPoints: ["src/cm-vendor.js"],
  bundle: true,
  minify: true,
  outfile: "dist/codemirror.bundle.js",
  format: "iife",
  target: ["es2020"]
}).catch(() => process.exit(1));
