// For enabling env variables in tests, please set
// the right values for each variable and change the
// file name to setEnvVars.ts
process.env = Object.assign(process.env, {
	POSTGRES_HOST: '',
	POSTGRES_PORT: 0,
	POSTGRES_USER: '',
	POSTGRES_PASSWORD: '',
	POSTGRES_DATABASE: ''
});