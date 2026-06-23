/**
 * PM2 Ecosystem Configuration — UBBFlow Backend
 *
 * Usage:
 *   npm run build -w backend
 *   pm2 start ecosystem.config.js
 *   pm2 save
 *   pm2 startup
 */
module.exports = {
  apps: [
    {
      name: 'ubbflow-backend',
      script: 'dist/index.js',
      cwd: __dirname,

      // Cluster mode — uses all available CPU cores
      instances: 'max',
      exec_mode: 'cluster',

      // Environment
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },

      // Restart policy
      max_memory_restart: '512M',
      restart_delay: 3000,
      max_restarts: 10,
      min_uptime: '5s',

      // Logs
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      merge_logs: true,

      // Zero-downtime deploys
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,

      // Health monitoring
      autorestart: true,
      watch: false,
    },
  ],

  /**
   * Deploy configuration (optional, for pm2 deploy)
   * Uncomment and fill in your server details.
   */
  // deploy: {
  //   production: {
  //     user: 'deploy',
  //     host: 'your-server-ip',
  //     ref: 'origin/main',
  //     repo: 'git@github.com:youruser/ubbflow.git',
  //     path: '/var/www/ubbflow',
  //     'post-deploy': 'npm install && npm run build -w backend && pm2 reload ecosystem.config.js --env production',
  //   },
  // },
}
