import config from "./config.json";

export const db = {
    production: {
      client: process.env.DB_CLIENT || "mysql",
      connection: {
        host: process.env.MYSQL_HOST,
        database: process.env.MYSQL_DATABASE,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        charset: "utf8"
      },
      useNullAsDefault: true
    },

    staging: {
      client: process.env.DB_CLIENT || "mysql",
      connection: {
        host: process.env.MYSQL_HOST,
        database: process.env.MYSQL_DATABASE,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        charset: process.env.MYSQL_CHARSET || "utf8",
        multipleStatements: true
      },
      useNullAsDefault: true
    },
    
    development: {
      client: "sqlite3",
      connection: {
        filename: "./development.sqlite"
      },
      useNullAsDefault: true
    },
    test: {
      client: "sqlite3",
      connection: {
        filename: "./test.sqlite"
      },
      useNullAsDefault: true
    }
};

export const mailgun = {
    login: process.env.MAILGUN_USER || config.mailgun.login,
    password: process.env.MAILGUN_PASSWORD || config.mailgun.password,
    apiKey: process.env.MAILGUN_KEY || config.mailgun.apiKey,
    email: process.env.MAILGUN_EMAIL || config.mailgun.email,
    newsletterEmail: process.env.MAILGUN_NEWSLETTER || config.mailgun.newsletterEmail,
    domain: process.env.MAILGUN_DOMAIN || config.mailgun.domain
};

export const github = {
    clientID: process.env.GITHUB_CLIENTID || config.github.clientID,
    clientSecret: process.env.GITHUB_SECRET || config.github.clientSecret,
    callbackURL: process.env.GITHUB_CALLBACK_URL || config.github.callbackURL,
    passReqToCallback: process.env.GITHUB_REQ_CALLBACK_URL || config.github.passReqToCallback
};

export const twitter = {
    consumerKey: process.env.TWITTER_KEY || config.twitter.consumerKey,
    consumerSecret: process.env.TWITTER_SECRET || config.twitter.consumerSecret,
    accessTokenKey: process.env.TWITTER_TOKEN_KEY || config.twitter.accessTokenKey,
    accessTokenSecret: process.env.TWITTER_TOKEN_SECRET || config.twitter.accessTokenSecret,
    callbackURL: config.twitter.callbackURL,
    passReqToCallback: config.twitter.passReqToCallback
};

export const google = {
    clientID: process.env.GOOGLE_CLIENTID || config.google.clientID,
    clientSecret: process.env.GOOGLE_SECRET || config.google.clientSecret,
    callbackURL: process.env.GOOGLE_CALLBACK_URL|| config.google.callbackURL,
    passReqToCallback: process.env.GOOGLE_REQ_CALLBACK_URL || config.google.passReqToCallback
};
