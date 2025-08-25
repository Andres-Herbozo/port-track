// Hubot configuration for PortTrack ChatOps
// This script enables ChatOps functionality for the PortTrack platform

module.exports = function(robot) {
  
  // Import required modules
  const axios = require('axios');
  const moment = require('moment');
  
  // Configuration
  const config = {
    kubernetes: {
      apiUrl: process.env.KUBERNETES_API_URL || 'https://kubernetes.default.svc',
      namespace: process.env.KUBERNETES_NAMESPACE || 'porttrack',
      token: process.env.KUBERNETES_TOKEN
    },
    prometheus: {
      url: process.env.PROMETHEUS_URL || 'http://prometheus.porttrack-monitoring:9090',
      queryTimeout: 30000
    },
    grafana: {
      url: process.env.GRAFANA_URL || 'http://grafana.porttrack-monitoring:3000',
      apiKey: process.env.GRAFANA_API_KEY
    },
    slack: {
      webhookUrl: process.env.SLACK_WEBHOOK_URL,
      defaultChannel: '#porttrack-ops'
    }
  };

  // Helper function to send Slack notifications
  function sendSlackNotification(channel, message, attachments = []) {
    const payload = {
      channel: channel,
      text: message,
      attachments: attachments
    };
    
    if (config.slack.webhookUrl) {
      axios.post(config.slack.webhookUrl, payload)
        .catch(error => robot.logger.error('Failed to send Slack notification:', error));
    }
  }

  // Helper function to execute kubectl commands
  async function executeKubectl(command) {
    try {
      const { exec } = require('child_process');
      return new Promise((resolve, reject) => {
        exec(`kubectl ${command}`, (error, stdout, stderr) => {
          if (error) {
            reject(error);
          } else {
            resolve(stdout);
          }
        });
      });
    } catch (error) {
      throw new Error(`Failed to execute kubectl command: ${error.message}`);
    }
  }

  // Helper function to query Prometheus
  async function queryPrometheus(query) {
    try {
      const response = await axios.get(`${config.prometheus.url}/api/v1/query`, {
        params: { query },
        timeout: config.prometheus.queryTimeout
      });
      return response.data.data.result;
    } catch (error) {
      throw new Error(`Failed to query Prometheus: ${error.message}`);
    }
  }

  // Command: Get deployment status
  robot.respond(/deployment status/i, async (res) => {
    try {
      res.reply('🔍 Checking deployment status...');
      
      const deployments = await executeKubectl(`get deployments -n ${config.kubernetes.namespace} -o wide`);
      const pods = await executeKubectl(`get pods -n ${config.kubernetes.namespace} -o wide`);
      
      const message = `📊 **PortTrack Deployment Status**\n\n**Deployments:**\n\`\`\`${deployments}\`\`\`\n\n**Pods:**\n\`\`\`${pods}\`\`\``;
      
      res.reply(message);
      
      // Send to Slack channel
      sendSlackNotification(config.slack.defaultChannel, message);
      
    } catch (error) {
      const errorMessage = `❌ Failed to get deployment status: ${error.message}`;
      res.reply(errorMessage);
      robot.logger.error(errorMessage);
    }
  });

  // Command: Get application metrics
  robot.respond(/metrics/i, async (res) => {
    try {
      res.reply('📈 Fetching application metrics...');
      
      const metrics = await queryPrometheus('up{job="porttrack-app"}');
      const responseTime = await queryPrometheus('histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{job="porttrack-app"}[5m]))');
      const errorRate = await queryPrometheus('rate(http_requests_total{job="porttrack-app", status=~"5.."}[5m]) / rate(http_requests_total{job="porttrack-app"}[5m])');
      
      let message = '📊 **PortTrack Application Metrics**\n\n';
      
      if (metrics && metrics.length > 0) {
        message += `✅ **Status:** Application is running\n`;
      } else {
        message += `❌ **Status:** Application is down\n`;
      }
      
      if (responseTime && responseTime.length > 0) {
        message += `⏱️ **Response Time (95th percentile):** ${(responseTime[0].value[1] * 1000).toFixed(2)}ms\n`;
      }
      
      if (errorRate && errorRate.length > 0) {
        const errorPercentage = (errorRate[0].value[1] * 100).toFixed(2);
        message += `🚨 **Error Rate:** ${errorPercentage}%\n`;
      }
      
      message += `\n🔗 **Grafana Dashboard:** ${config.grafana.url}/d/porttrack-overview`;
      
      res.reply(message);
      
    } catch (error) {
      const errorMessage = `❌ Failed to get metrics: ${error.message}`;
      res.reply(errorMessage);
      robot.logger.error(errorMessage);
    }
  });

  // Command: Scale application
  robot.respond(/scale (up|down) to (\d+) replicas/i, async (res) => {
    try {
      const direction = res.match[1];
      const replicas = parseInt(res.match[2]);
      
      if (replicas < 1 || replicas > 10) {
        res.reply('❌ Replicas must be between 1 and 10');
        return;
      }
      
      res.reply(`🔄 Scaling PortTrack application to ${replicas} replicas...`);
      
      await executeKubectl(`scale deployment porttrack-app -n ${config.kubernetes.namespace} --replicas=${replicas}`);
      
      const message = `✅ Successfully scaled PortTrack application to ${replicas} replicas`;
      res.reply(message);
      
      // Send to Slack channel
      sendSlackNotification(config.slack.defaultChannel, message);
      
    } catch (error) {
      const errorMessage = `❌ Failed to scale application: ${error.message}`;
      res.reply(errorMessage);
      robot.logger.error(errorMessage);
    }
  });

  // Command: Restart deployment
  robot.respond(/restart deployment/i, async (res) => {
    try {
      res.reply('🔄 Restarting PortTrack deployment...');
      
      await executeKubectl(`rollout restart deployment porttrack-app -n ${config.kubernetes.namespace}`);
      
      const message = '✅ Successfully restarted PortTrack deployment';
      res.reply(message);
      
      // Send to Slack channel
      sendSlackNotification(config.slack.defaultChannel, message);
      
    } catch (error) {
      const errorMessage = `❌ Failed to restart deployment: ${error.message}`;
      res.reply(errorMessage);
      robot.logger.error(errorMessage);
    }
  });

  // Command: Get logs
  robot.respond(/logs(?: (\d+))?/i, async (res) => {
    try {
      const lines = res.match[1] || 50;
      
      if (lines > 100) {
        res.reply('❌ Maximum log lines allowed is 100');
        return;
      }
      
      res.reply(`📋 Fetching last ${lines} log lines...`);
      
      const logs = await executeKubectl(`logs -n ${config.kubernetes.namespace} -l app.kubernetes.io/name=porttrack-app --tail=${lines}`);
      
      if (logs.length > 1000) {
        const truncatedLogs = logs.substring(0, 1000) + '\n... (truncated)';
        res.reply(`📋 **Last ${lines} Log Lines (truncated):**\n\`\`\`${truncatedLogs}\`\`\``);
      } else {
        res.reply(`📋 **Last ${lines} Log Lines:**\n\`\`\`${logs}\`\`\``);
      }
      
    } catch (error) {
      const errorMessage = `❌ Failed to get logs: ${error.message}`;
      res.reply(errorMessage);
      robot.logger.error(errorMessage);
    }
  });

  // Command: Get alerts
  robot.respond(/alerts/i, async (res) => {
    try {
      res.reply('🚨 Fetching active alerts...');
      
      const alerts = await queryPrometheus('ALERTS{alertstate="firing"}');
      
      if (!alerts || alerts.length === 0) {
        res.reply('✅ No active alerts at the moment');
        return;
      }
      
      let message = `🚨 **Active Alerts (${alerts.length}):**\n\n`;
      
      alerts.forEach((alert, index) => {
        const severity = alert.metric.severity || 'unknown';
        const summary = alert.metric.alertname || 'Unknown alert';
        const emoji = severity === 'critical' ? '🔴' : severity === 'warning' ? '🟡' : '🔵';
        
        message += `${emoji} **${severity.toUpperCase()}:** ${summary}\n`;
      });
      
      message += `\n🔗 **View in AlertManager:** ${config.prometheus.url.replace('/api/v1/query', '')}/#/alerts`;
      
      res.reply(message);
      
    } catch (error) {
      const errorMessage = `❌ Failed to get alerts: ${error.message}`;
      res.reply(errorMessage);
      robot.logger.error(errorMessage);
    }
  });

  // Command: Health check
  robot.respond(/health check/i, async (res) => {
    try {
      res.reply('🏥 Performing health check...');
      
      const healthChecks = [
        { name: 'Kubernetes API', check: () => executeKubectl('get nodes') },
        { name: 'PortTrack App', check: () => queryPrometheus('up{job="porttrack-app"}') },
        { name: 'Prometheus', check: () => queryPrometheus('up{job="prometheus"}') },
        { name: 'Grafana', check: () => axios.get(`${config.grafana.url}/api/health`) }
      ];
      
      const results = [];
      
      for (const healthCheck of healthChecks) {
        try {
          await healthCheck.check();
          results.push(`✅ ${healthCheck.name}: Healthy`);
        } catch (error) {
          results.push(`❌ ${healthCheck.name}: Unhealthy (${error.message})`);
        }
      }
      
      const message = `🏥 **PortTrack Health Check Results:**\n\n${results.join('\n')}`;
      res.reply(message);
      
    } catch (error) {
      const errorMessage = `❌ Failed to perform health check: ${error.message}`;
      res.reply(errorMessage);
      robot.logger.error(errorMessage);
    }
  });

  // Command: Help
  robot.respond(/help/i, (res) => {
    const helpMessage = `🤖 **PortTrack ChatOps Commands:**\n\n` +
      `📊 **deployment status** - Get current deployment status\n` +
      `📈 **metrics** - Get application metrics\n` +
      `🔄 **scale up/down to X replicas** - Scale application\n` +
      `🔄 **restart deployment** - Restart the deployment\n` +
      `📋 **logs [lines]** - Get application logs (default: 50)\n` +
      `🚨 **alerts** - Get active alerts\n` +
      `🏥 **health check** - Perform system health check\n` +
      `❓ **help** - Show this help message\n\n` +
      `💡 **Examples:**\n` +
      `• "scale up to 5 replicas"\n` +
      `• "logs 100"\n` +
      `• "deployment status"`;
    
    res.reply(helpMessage);
  });

  // Event: Deployment notifications
  robot.on('deployment.started', (data) => {
    const message = `🚀 **Deployment Started**\n\n` +
      `**Environment:** ${data.environment}\n` +
      `**Version:** ${data.version}\n` +
      `**Triggered by:** ${data.triggeredBy}\n` +
      `**Time:** ${moment().format('YYYY-MM-DD HH:mm:ss UTC')}`;
    
    sendSlackNotification(config.slack.defaultChannel, message);
  });

  robot.on('deployment.completed', (data) => {
    const message = `✅ **Deployment Completed**\n\n` +
      `**Environment:** ${data.environment}\n` +
      `**Version:** ${data.version}\n` +
      `**Duration:** ${data.duration}\n` +
      `**Status:** ${data.status}\n` +
      `**Time:** ${moment().format('YYYY-MM-DD HH:mm:ss UTC')}`;
    
    sendSlackNotification(config.slack.defaultChannel, message);
  });

  robot.on('deployment.failed', (data) => {
    const message = `❌ **Deployment Failed**\n\n` +
      `**Environment:** ${data.environment}\n` +
      `**Version:** ${data.version}\n` +
      `**Error:** ${data.error}\n` +
      `**Time:** ${moment().format('YYYY-MM-DD HH:mm:ss UTC')}`;
    
    sendSlackNotification(config.slack.defaultChannel, message);
  });

  // Event: Alert notifications
  robot.on('alert.firing', (data) => {
    const message = `🚨 **Alert Firing**\n\n` +
      `**Alert:** ${data.alertname}\n` +
      `**Severity:** ${data.severity}\n` +
      `**Description:** ${data.description}\n` +
      `**Instance:** ${data.instance || 'N/A'}\n` +
      `**Time:** ${moment().format('YYYY-MM-DD HH:mm:ss UTC')}`;
    
    sendSlackNotification(config.slack.defaultChannel, message);
  });

  robot.on('alert.resolved', (data) => {
    const message = `✅ **Alert Resolved**\n\n` +
      `**Alert:** ${data.alertname}\n` +
      `**Severity:** ${data.severity}\n` +
      `**Instance:** ${data.instance || 'N/A'}\n` +
      `**Time:** ${moment().format('YYYY-MM-DD HH:mm:ss UTC')}`;
    
    sendSlackNotification(config.slack.defaultChannel, message);
  });

  // Log when Hubot is ready
  robot.logger.info('PortTrack ChatOps Hubot is ready! 🚢');
  
  // Send startup notification
  sendSlackNotification(config.slack.defaultChannel, '🤖 PortTrack ChatOps Hubot is online and ready to help! 🚢');
};
