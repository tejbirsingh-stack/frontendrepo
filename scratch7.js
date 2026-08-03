const axios = require('axios');
const jwt = require('jsonwebtoken');

const token = jwt.sign({ id: 'some-user', orgId: 'some-org' }, 'secret', { expiresIn: '1h' });

console.log("No token available to simulate api request. Skipping.");
