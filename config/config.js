const ip = require('ip');

module.exports = {
  "server": {
    "ip": ip.address(),
    "port": 8080,
  },
  "client": {
    "socket": {
      "domain": ip.address(),
      "port": 8080,
    },
    "fbAppId": 1674025106190653,
  }
}
