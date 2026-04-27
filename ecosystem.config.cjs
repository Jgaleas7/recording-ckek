module.exports = {
  apps: [
    {
      name: 'backend',
      cwd: './server',
      script: 'index.js',
      autorestart: true,
      max_restarts: 10,
      watch: false,
      env: {
        NODE_ENV: 'production',
      },
      out_file: './logs/backend-out.log',
      error_file: './logs/backend-err.log',
      merge_logs: true,
      time: true,
    },
    {
      name: 'frontend',
      cwd: './client',
      script: 'node_modules/vite/bin/vite.js',
      args: ['--host', '0.0.0.0', '--port', '5173'],
      autorestart: true,
      max_restarts: 10,
      watch: false,
      env: {
        NODE_ENV: 'production',
      },
      out_file: './logs/frontend-out.log',
      error_file: './logs/frontend-err.log',
      merge_logs: true,
      time: true,
    },
  ],
}
