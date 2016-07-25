node-servlet
============

[![NPM](https://nodei.co/npm/servlet.png#1)](https://nodei.co/npm/servlet/)

Run multiple servers in one node.js process, restarting individual servers when their code files change on disk.

Servlet uses bouncy to route traffic based on host headers to individual projects ("servlets"). A servlet is a 
module that can be loaded with 'require' and exports a `start()` and a `stop()` function. The servlet server 
reloads modules if their source or their dependencies (autodetected) change on disk, or if the servlet server 
configuration changes (allowing you to hot-add and -remove servlets).

## Running servlet

running on unprivileged port:
```servlet config.conf 8080```

running on privileged port as root and shedding priviliges immediately to continue as user ```wwwdata```:
```servlet config.conf 80 wwwdata:wwwdata```  

## Example config

```
[
  { "host": "project1.example.com", "file": "./project1/index.js" },
  { "host": "project2.example.com", "file": "../funstuff/server.js" }
]
```

## Example servlet

```
var app = require('http').createServer(function(req,res){res.end(req.url)})
exports.start = function( options ) {
    // start listening on the port assigned to the servlet
      app.listen( options.port );
}
exports.stop = function() {
    // clean up
      app.close();
}
```

## Launching and respawning with upstart

On Ubuntu systems upstart can be used to launch servlet at boot time and keep it running. Check out ```node-servlet.conf``` for an upstart example config file.

