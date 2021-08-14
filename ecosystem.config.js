// PM2 Ecosystem

module.exports = {
	apps: [
		{
			name: 'rp-client',
			script: './src/app.js',
			env: {
				NODE_ENV: 'development',
				DEBUG: '*,-axm:*'
			},
			env_production: {
				NODE_ENV: 'production',
				DEBUG: '*,-axm:*,-*:warning'
			}
		}
	]
};
