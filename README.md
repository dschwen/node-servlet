node-servlet
============

Run multiple servers in one node.js process, restarting individual servers when their code files change on disk.

Servlet uses bouncy to route traffic based on host headers to individual projects ("servlets"). A servlet is a 
module that can be loaded with 'require' and exports a start() and a stop() function. The servlet server 
reloads modules if their source or their dependencies (autodetected) change on disk, or if the servlet server 
configuration changes (allowing you to hot-add and -remove servlets).

Example:

```servlet config.conf 8080```
