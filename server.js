const http        = require('http');
const url         = require('url');
const querystring = require('querystring');
const fs = require('fs');

const todos        = [];
const app = function(req){

    let parsedUrl = url.parse(req.url);

    return {
        'get': function (_url, fn) {
            let realUrlParts = parsedUrl.pathname.split('/');
            if (req.method === 'GET') {
                if (parsedUrl.pathname === _url) {
                    fn();
                } else if (_url.indexOf(':') > -1) {
                    let urlParts = _url.split('/');
                    let urlVars  = {};
                    urlParts.map(function (elem, index) {
                        if (elem.indexOf(':') > -1 && realUrlParts[index]) {
                            urlVars[elem.replace(':', '')] = realUrlParts[index];
                        }
                    });
                    if (Object.keys(urlVars).length > 0)
                        fn(urlVars);
                }

            }
        },
        'post': function (_url, fn) {
            if (req.method === 'POST') {
                if (parsedUrl.pathname === _url) {
                    let body = '';
                    req.on('data', function (chunk) {
                        body += chunk.toString();
                    });

                    req.on('end', function () {
                        fn(body);
                    });
                }
            }
        },
        'put': function (_url, fn) {
            if (req.method === 'PUT') {
                let urlParts = parsedUrl.pathname.split('/');
                if (_url.indexOf(':id') > -1) {
                    let id = getIndexFromID(urlParts[2]);
                    if (id >=0 && todos[id]) {
                        let body = '';
                        req.on('data', function (chunk) {
                            body += chunk.toString();
                        });

                        req.on('end', function () {
                            fn(body, id);
                        });
                    } else {
                        console.log('PUT ' + id + ' IS NOT FOUND');
                    }
                }

            }
        },
        'delete': function (_url, fn) {
            if (req.method === 'DELETE') {
                let urlParts = parsedUrl.pathname.split('/');
                let id = getIndexFromID(urlParts[2]);
                if (id >=0 && todos[id]) {
                    fn(id);
                } else {
                    console.log('DELETE ' + id + ' IS NOT FOUND');
                }

            }
        }
    }
};


const httpServer = http.createServer(function (req, res) {

    const parsedUrl   = url.parse(req.url);
    const parsedQuery = querystring.parse(parsedUrl.query);
    let result        = [];

    app(req).get('/', function () {
        //result = todos;
        fs.readFile('./index.html', function (err, html) {
            if (err) {
                console.error(err);
            }
            res.writeHeader(200, {"Content-Type": "text/html"});
            res.write(html);
            res.end();
        });
    });
    app(req).get('/todos/', function () {
        for (let i = 0; i < todos.length; i++) {
            if (areEqual(parsedQuery, todos[i])) {
                result.push(todos[i]);
            }
        }
        res.end(JSON.stringify(result));
    });
    app(req).get('/todos/:id', function (urlVars) {
        result = todos[urlVars['id']] || {};
        res.end(JSON.stringify(result));
    });
    app(req).post('/todos', function (body) {
        todos.push({
            msg: body,
            completed: false,
            id : Math.floor((Math.random() * 100000) + 1)
        });
        result = {status: 'OK'};
        res.end(JSON.stringify(result));
    });
    app(req).put('/todos/:id', function (body, id) {
        if(!body)
            return false;
        let bodyObj = JSON.parse(body);//json parse error
        console.log(body, bodyObj)
        todos[id] = mergeObjects(todos[id], bodyObj);
        console.log('----------', todos)
        result    = {status: 'OK'};
        res.end(JSON.stringify(result));
    });
    app(req).delete('/todos/:id', function (id) {
        console.log('deleteeeee',id, todos);
        todos.splice(id, 1);
        result = {status: 'OK'};
        res.end(JSON.stringify(result));
    });

});

httpServer.listen(3001); // start server and have it listen on port 3001

function areEqual(obj1, obj2) {
    for (let prop in obj1) {
        //console.log('______',obj2[prop], obj1[prop]);
        if (obj1[prop] == 'true')
            obj1[prop] = true;
        if (obj1[prop] == 'false')
            obj1[prop] = false;
        if (obj2[prop] == 'true')
            obj2[prop] = true;
        if (obj2[prop] == 'false')
            obj2[prop] = false;

        if (obj1[prop] != obj2[prop]) {
            return false;
        }
    }

    return true;
}
function mergeObjects(obj1, obj2) {
    let obj3 = {};
    for (var attrname in obj1) {
        obj3[attrname] = obj1[attrname];
    }
    for (var attrname in obj2) {
        obj3[attrname] = obj2[attrname];
    }
    return obj3;
};
function getIndexFromID(_id) {
    let result;
    todos.forEach(function( todo, id ) {
        if(todo.id == _id) {
            result = id;
        }
    });
    return result;
}