
// /* ***************
//  * Connection Pool
//  * SSL Object needed for local testing of app
//  * But will cause problems in production environment
//  * If - else will make determination which to use
//  * *************** */

const { Pool } = require('pg');
require('dotenv').config();

let pool;

if (process.env.NODE_ENV == 'development') {
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false, // Allow for self-signed certificates in development
        },
    });
} else {
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false, // This ensures SSL is enforced in production as well
        },
    });
}

module.exports = pool;
