import typescript from "rollup-plugin-typescript";

export default {
    input: 'src/main.ts',
    plugins: [
        typescript({
            exclude: "node_modules/**",
            typescript: require("typescript")
        }),
    ],
    output: [
        {
            format: "cjs",
            file: "lib/bundle.cjs.js"
        },
        {
            format: "esm",
            file: "lib/bundle.esm.js"
        },
        {
            format: "umd",
            name: "cookie-master",
            file: "lib/bundle.umd.js"
        },
    ]
};