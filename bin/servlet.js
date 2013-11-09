#!/usr/bin/env node

var configFile = process.argv[2]
  , port = parseInt(process.argv[3] || '80', 10)
  , ugid = process.argv[4] || null
  , fs = require('fs')
  , Notify = require('fs.notify')
  , servlet = require('../')
  , handler = null
  ;

if (!configFile || !port) {
    console.error('Usage: servlet hosts.json [port] [uid:gid]');
    process.exit(1);
}

// load config file
var config = JSON.parse(fs.readFileSync(configFile));
servlet.init( config, port );

// drop root priviliges
if( process.getuid() == 0 ) {
  if( ugid===null) {
    throw "Refusing to run as root, please supply user and group to change to.";
  }

  var ug=ugid.split(':');
  process.setgid(ug[1]);
  process.setuid(ug[0]);
}

// set up watch on config file
var notifier = new Notify( configFile );
notifier.on( 'change', function(){
  clearTimeout( handler );
  handler = setTimeout( function() {
    var config = JSON.parse(fs.readFileSync(configFile));
    servlet.updateConfig( config );
  }, 1000 );
});

