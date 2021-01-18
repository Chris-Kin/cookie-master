import typescript from "rollup-plugin-typescript";
import copy from 'rollup-plugin-copy';
import { terser } from "rollup-plugin-terser";

export default [
  {
    input: 'src/script/popup.js',
    plugins: [
      typescript({
        exclude: "node_modules/**",
        typescript: require("typescript")
      }),
      copy({
        targets: [
          { src: 'src/asset/*', dest: 'dist/asset/' },
          { src: 'src/html/*', dest: 'dist/html/' },
          { src: 'src/style/*', dest: 'dist/style/' },
          { src: 'src/manifest.json', dest: 'dist/' },
        ]
      }),
    ],
    output: [
      {
        format: "esm",
        file: "dist/script/popup.js",
        plugins: process.env.NODE_ENV === 'prod' ? [terser()] : []
      },
    ]
  },
];