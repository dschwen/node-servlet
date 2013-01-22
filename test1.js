var bouncy = require('bouncy')

exports.start = function( options ) {
  console.log("Starting test1 on port ", options.port );
}

exports.stop = function() {
  console.log("Stopping test1");
}

