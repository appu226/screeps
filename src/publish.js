var https = require('https');
var fs = require('fs');

var mainContents = fs.readFileSync('javascript/main.js').toString();

var trim = function(str) {
   return str.toString().replace(/(\r\n|\n|\r)/gm,"");    
}

var email = trim(fs.readFileSync('ignored/screepsUser.txt')),
    password = trim(fs.readFileSync('ignored/screepsPassword.txt')),
    data = {
        branch: 'default',         
        modules: {
            main: mainContents,
        }
    };

var req = https.request({
	hostname: 'screeps.com',
	port: 443,
	path: '/api/user/code',
	method: 'POST',
	auth: email + ':' + password,
	headers: {
		'Content-Type': 'application/json; charset=utf-8'
	}
});


req.write(JSON.stringify(data));
req.end();
