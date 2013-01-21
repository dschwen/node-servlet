#!/usr/bin/env node

var configFile = process.argv[2];
var port = parseInt(process.argv[3], 10);

if (!configFile || !port) {
    console.error('Usage: servlet [hosts.json] [port]');
    process.exit(1);
}

var fs = require('fs')
  , servlet = require('../')
  ;
