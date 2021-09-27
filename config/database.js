const env = process.env.NODE_ENV || 'development'
import knexfile from '../knexfile'
const knex = require('knex')(knexfile[env])

export default knex