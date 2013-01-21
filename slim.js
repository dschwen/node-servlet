var fs = require('fs')
  , bouncy = require('bouncy')
  , path = require('path')
  , Notify = require('fs.notify')
  ;

var servlets = [
  { file: './test1.js', host: 'test1.node.schwen.de' },
  { file: './test2.js', host: 'test2.node.schwen.de' }
];

var hosts = {};

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
  if( s.object ) {
    if( !'stop' in s.object ) {
      console.log( 'No stop method in servlet!' );
    }
    s.object.stop();
  }

  // start new version
  s.object = o;
  if( !'start' in s.object ) {
    console.log( 'No start method in servlet!' );
  } else {
    s.object.start( { port: s.port } );
  }
}

function init() {
  var s, i, port = 8080;

  function setupServlet(s) {
    var d;

    // get full path
    s.file = path.resolve(s.file);

    // set port number
    s.port = s.port || port++;

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
      restartServlet(s);
    } );

    // add to bouncy config
    hosts[ s.host ] = s.port;
  }

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
}

init();

