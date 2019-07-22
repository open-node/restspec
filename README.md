# restspec rest-api test

## usage

* npm install restspec --save-dev

```js
var Restspec = require('restspec');
new Restspec(options);
```

## options

* `name` String, This test's name.
* `urlRoot` String, Url root eg. http://127.0.0.1
* `cases` Array, Test cases.
* `hooks` Object, Hooks function.
  * `done` Function, Called when test cases exec done.
* `globals.request.headers` Object,

## case
* `name` String, This is name of case
* `uri` String, Request url is `urlRoot` concat `uri`. eg. /session
* `verb` String, Enum `get`, `post`, `put`, `patch`, `delete` default `get`
* `headers` Object, Request customer headers.
* `data` Fixed, Request send data.
* `expects`
  * `Status` response.statusCode
  * `JSON` assert response.body
```js
//case1. assert body
JSON: {
  id: 1,
  name: 'Hello'
}

//case2. body is an array, assert one
JSON: ['0', {
  id: 1,
  name: 'Hello'
}]

//case2. body is an array, assert all
JSON: ['*', {
  id: 1,
  name: 'Hello'
}]

```
  * `JSONTypes` assert response.body type
  * `JSONLength` assert response.body length
  * `Header` assert one response.headers
```js
Header: ['x-content-record-total', '2']
```
  * `Headers` assert some response.headers
```js
Headers: [
  ['x-content-record-total', '2'],
  ['content-type', 'application/json']
]
```

## Advanced Usage

```js
JSON: {
  // assert is require('assert')
  id: function(actual, assert) {
    assert.equal(typeof actual, 'number');
    assert.equal(actual, 20);
  }
```


```js
var case = {
  name: 'This is name of case',
  uri: '/session',
  expects: {
    Status: 201,
    JSON: {
      id: 1,
      name: 'Hello world'
    },
    JSONTypes: ['parent', {
      id: Number,
      name: String
    }]
  }
}
```

```js
var case = function(lastBody, lastRes) {
  return {
    name: 'This is function return case'
    uri: '/session',
    expects: {
      Status: 201,
      JSON: {
        id: 1,
        name: 'Hello world'
      },
      JSONTypes: ['parent', {
        id: Number,
        name: String
      }]
    }
  }
};
```

```js
var case = function(lastBody, lastRes) {
  return new Promise(function(resolve, reject) {
    return resolve({
      name: 'This is function return case with promise'
      uri: '/session',
      expects: {
        Status: 201,
        JSON: {
          id: 1,
          name: 'Hello world'
        },
        JSONTypes: ['parent', {
          id: Number,
          name: String
        }]
      }
    })
  };
};
```

```js
var case = async () => {
  const user = await Model.findOne({ where: { id: 1 } });

    // If the function is returned, it will be called.
    return () => {
      const { age } = user;

      if (age <= 18) return new Error(`Adult only: ${age}`);

      return null;
    };
  };
};
```

## Comment
* cases run one by one
