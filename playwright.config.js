const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  webServer: process.env.QA_LOCAL === '1' ? {
    command: 'node tests/static-server.js',
    url: 'http://127.0.0.1:4173/admin.html',
    reuseExistingServer: true,
    timeout: 20000
  } : undefined
});
