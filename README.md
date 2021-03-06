# NodeNA

> A Node.js community portal and social platorm for developers in Namibia


NodeNA, is a platform that aims to make it easy to find inormation about Node.js, learn, share, and connect with other Node users in Namibia


## How to set up?

### Development

1. get clone https://github.com/NodeNA/nodena-api.git
2. cd nodena-api && npm install 
3. npm run setup
4. npm run migrate
5. npm run dev

### Staging
  1. git clone https://github.com/NodeNA/nodena-api.git
  2. cd nodena-api && npm install
  3. export NODE_ENV=staging && npm run setup pg/mysql
  4. npm run migrate
  5. npm run staging

### Production
  1. git clone https://github.com/NodeNA/nodena-api.git
  2. cd nodena-api && npm install
  3. export NODE_ENV=production && npm run setup pg/mysql
  4. npm run migrate
  5. npm run production


### Software Requirements
  - MySQL/Postgres if you are running on staging or production
  - Global npm modules - `pm2`, `nodemon`, `knex`.


License
-------

(MIT License)

Copyright (c) 2014 - 2016 Geraldo Kanodnga Fillipus <nodejsna@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
