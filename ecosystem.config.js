module.exports = {
    apps: [
        {
            name: 'tool tele',
            script: './dist/main.js',
            watch: false,
            env: {
                NODE_ENV: "production",
                PORT: 3002
            }
        },
    ],
}
