# restspec rest-api test base on frisbyjs

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
* `globals` Object, Look [frisby.globalSetup](https://github.com/vlucas/frisby).

## case
* `name` String, This is name of case 
* `uri` String, Request url is `urlRoot` concat `uri`. eg. /session
* `verb` String, Enum `get`, `post`, `put`, `patch`, `delete` default `get`
* `headers` Object, Request customer headers.
* `data` Fixed, Request send data.
* `inspectJSON`: true, Boolean, Optional, Console output response.JSON where `true`.
* `inspectBody`: true, Boolean, Optional, Console output response.body where `true`.
* `expects` Object, Look [frisbyjs api document](http://frisbyjs.com/docs/api/)
```js
var case = {
  name: 'This is name of case', 
  uri: '/session',
  inspectJSON: true, // console.log will output response.JSON
  inspectBody: true, // console.log will output response.body
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

## Comment
* cases run one by one
