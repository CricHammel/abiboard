module.exports = {
  apps: [{
    name: 'abiboard',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      NEXTAUTH_URL: 'https://muellerix2k.ddns.net/abiboard',
      // Falls es andere URL-Variablen gibt:
      PUBLIC_URL: 'https://muellerix2k.ddns.net/abiboard',
      BASE_URL: 'https://muellerix2k.ddns.net/abiboard'
    }
  }]
}
