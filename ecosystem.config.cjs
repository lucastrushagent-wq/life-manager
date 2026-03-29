module.exports = {
  apps: [
    {
      name: 'life-manager',
      script: './node_modules/.bin/tsx',
      args: 'server/index.ts',
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
    },
  ],
}
