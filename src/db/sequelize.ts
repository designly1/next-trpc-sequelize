import { Sequelize, Options } from 'sequelize';
import pg from 'pg';
import c from 'colors';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());

const USE_SSL = false;
const IS_DEV = process.env.NODE_ENV !== 'production';
const DB_STRING = process.env.DB_STRING || '';

const logQuery = (query: string) => {
	console.log(c.green(new Date().toLocaleString()));
	console.log(c.blue(query));
};

const makeConfig = () => {
	const config: Options = {
		dialect: 'postgres',
		dialectModule: pg,
		logging: IS_DEV ? logQuery : false,
	};

	if (USE_SSL) {
		config.dialectOptions = {
			ssl: {
				require: true,
				rejectUnauthorized: false,
			},
		};
	}

	return config;
};

const sequelize = new Sequelize(DB_STRING, makeConfig());

export default sequelize;
