#!/usr/bin/env node

var configFile = process.argv[2]
  , port = parseInt(process.argv[3], 10)
  , fs = require('fs')
  , Notify = require('fs.notify')
  , servlet = require('../')
  ;

if (!configFile || !port) {
    console.error('Usage: servlet [hosts.json] [port]');
    process.exit(1);
}

// load config file
var config = JSON.parse(fs.readFileSync(configFile));
servlet.init( config, port );

// set up watch on config file
var notifier = new Notify( configFile );
notifier.on( 'change', function(){
  var config = JSON.parse(fs.readFileSync(configFile));
  servlet.updateConfig( conf )
});

