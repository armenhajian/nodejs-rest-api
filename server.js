const http        = require('http');
const url         = require('url');
const querystring = require('querystring');

const todos        = [
    {msg: 'msg 1', completed: true},
    {msg: 'msg 2', completed: false},
    {msg: 'msg 3', completed: false}
];
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
                let realUrlParts = parsedUrl.pathname.split('/');
                if (_url.indexOf(':id') > -1) {
                    let id = realUrlParts[2];
                    if (id && todos[id]) {
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
                let urlParts  = parsedUrl.pathname.split('/');
                let id        = urlParts[2];
                if (id && todos[id]) {
                    fn(id);
                } else {
                    console.log('PUT ' + id + ' IS NOT FOUND');
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
        result = todos;
    });
    app(req).get('/todos/', function () {
        for (let i = 0; i < todos.length; i++) {
            if (areEqual(parsedQuery, todos[i])) {
                result.push(todos[i]);
            }
        }
    });
    app(req).get('/todos/:id', function (urlVars) {
        result = todos[urlVars['id']] || {};
    });
    app(req).post('/todos', function (body) {
        todos.push({
            msg: body,
            completed: false
        });
        result = {status: 'OK'};
    });
    app(req).put('/todos/:id', function (body, id) {
        if(!body)
            return false;
        let bodyObj = JSON.parse(eval(body));//json parse error
        todos[id] = mergeObjects(todos[id], bodyObj);
        result    = {status: 'OK'};
    });
    app(req).delete('/todos/:id', function (id) {
        todos.splice(id, 1);
        result = {status: 'OK'};
    });


    res.end(JSON.stringify(result));
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