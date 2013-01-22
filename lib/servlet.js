var fs = require('fs')
  , bouncy = require('bouncy')
  , path = require('path')
  , Notify = require('fs.notify')
  , servletPort
  ;

var servlets = [];
var hosts = {};

/*[
  { file: './test1.js', host: 'test1.node.schwen.de' },
  { file: './test2.js', host: 'test2.node.schwen.de' }
];*/

function setupServlet(s) {
  var d;
  
  // restart timeout handler
  s.handler = null;

  // get full path
  s.file = path.resolve(s.file);

  // set port number
  s.port = s.port || servletPort++;

  // clear require cache
  for( d in require.cache ) {
    if( typeof d === 'string' ) {
      delete require.cache[d];
    }
  }

  // start servlet
  restartServlet(s);

  // dependencies
  s.deps = [];
  for( d in require.cache ) {
    if( typeof d === 'string' ) {
      s.deps.push(d);
    }
  }
  console.log(s.deps);

  // set up file watcher
  s.notify = new Notify( s.deps ); 
  s.notify.on( 'change', function() {
    // clear existing timeout handler
    clearTimeout( s.handler );
    // set 1sec timeout to avoid double restart triggered by editors like vim
    s.handler = setTimeout( function() { restartServlet(s); }, 1000 );
  } );

  // add to bouncy config
  hosts[ s.host ] = s.port;
}

function stopServlet(s) {
  if ( s.object ) {
    if ( !( 'stop' in s.object ) ) {
      console.log( 'No stop method in servlet', s.file );
    }
    s.object.stop();
  }
}

function restartServlet(s) {
  var o;
  console.log( 'Restarting servlet', s.file );

  // delete require cache to force module reload
  delete require.cache[s.file];

  // try rerequireing, abort if errors are found in module 
  try {
    o = require(s.file);
  } catch(e) {
    console.log( 'Not restarting, error in file', s.file, e );
    return;
  }

  // stop old version
  stopServlet(s);

  // start new version
  s.object = o;
  if ( !( 'start' in s.object ) ) {
    console.log( 'No start method in servlet!' );
  } else {
    s.object.start( { port: s.port } );
  }
}

exports.updateConfig = function( conf ) {
  var oldFiles = {}
    , newFiles = []
    , i, s, c, n = [];

  // hash list of old servlets
  for( i=0; i<servlets.length; ++i ) {
    newFiles[servlets[i].file] = i;
  }

  // hash list of new servlets
  for( i=0; i<conf.length; ++i ) {
    newFiles[conf[i].file] = i;
  }

  // detect removed or changed entries
  for( i in oldFiles ) {
    s = servlets[oldFiles[i]];
    if ( !( i in newFiles ) ) {
      // stop removed servlet
      if( s.handler !== null ) {
        clearTimeout(s.handler);
      }
      stopServlet(s);
      // unnotify
      s.notify.close();
    } else {
      c = conf[newFiles[i]];

      // check for changed host name
      if( s.host !== c.host ) {
        delete hosts[s.host];
        hosts[c.host] = s.port;
        s.host = c.host;
      }
      n.push(s);
    }
  }

  // detect entirely new entries
  for( i in newFiles ) {
    if( !( i in oldFiles ) ) {
      console.log(i);
      c = conf[newFiles[i]];
      setupServlet(c);
      n.push(c);
    }
  }

  // update servlet list
  servlets = n;
}

exports.init = function( config, mainPort ) {
  var s, i;

  // copy config
  servlets = config;
  servletPort = mainPort + 1;

  // initialize all servlets
  for( i=0; i < servlets.length;  i++ ) {
    setupServlet( servlets[i] );
  }

  // start server
  var server = bouncy(function (req, res, bounce) {
    var port = hosts[req.headers.host];

    if( port ) {
      bounce(port);
    } else {
      // error page
      res.statusCode = 404;
      res.end('no such host');
    }
  });
  server.listen(8000);

  // graceful shutdown
  process.on( 'SIGINT', function() {
    for( i=0; i < servlets.length;  i++ ) {
      stopServlet( servlets[i] );
    }
    process.exit(0);
  });
}
