// PM2 Ecosystem

const { join } = require('path');

module.exports = {
	apps: [
		{
			name: 'rp-client',
			script: join(__dirname, 'src/app.js'),
			env: {
				NODE_ENV: 'development',
				DEBUG: '*,-axm:*',
				DEBUG_COLORS: 'true'
			},
			env_production: {
				NODE_ENV: 'production',
				DEBUG: '*,-axm:*,-*:warning',
				DEBUG_COLORS: 'true'
			}
		}
	]
};
