# restspec rest-api test base on frisbyjs

## usage

* npm install restspec --save

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
* `uri` String, Request url is `urlRoot` concat `uri`. eg. /session
* `verb` String, Enum `get`, `post`, `put`, `patch`, `delete` default `get`
* `headers` Object, Request customer headers.
* `data` Fixed, Request send data.
* `expects` Object, Look [frisbyjs api document](http://frisbyjs.com/docs/api/)
  ```js
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
  ```

## Comment
* cases run one by one
