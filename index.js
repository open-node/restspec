var async   = require('async')
  , assert  = require('assert')
  , request = require('request')
  , last    = {}
  , _       = require('underscore')
  , queue   = []
  , inMocha = _.isFunction(global.describe) && _.isFunction(global.it);

var execQueue = function() {
  var fn = queue.shift();
  fn && fn(execQueue);
};

if (!inMocha) {
  global.it = function(name, callback) { queue.push(callback) };
}

function Restspec(opts) {
  this.startedAt = new Date();
  this.tests = this.assertions = this.failures = this.skipped = 0;
  this.errors = [];
  this.initialize(opts);
  this.run();
};

// 参数
Restspec.prototype.options = {

  // 测试的名称
  // 方便定位问题
  name: 'default spec',

  // api 测试的根地址, 末尾不加斜杠
  // eg. http://127.0.0.1:8080
  urlRoot: null,
  // 测试用例，测试用例需要完全按照约定规范书写
  // cases 为数组类型。数组会严格按照顺序执行
  // 数组的每一项为object，格式如下
  // {
  //   uri: '/session'
  //   verb: 'get'
  //   data: {foo: 'bar'}, // 要发送的数据
  //   expects: { // 测试断言, 这里具体的用法参考 http://frisbyjs.com/docs/api/
  //     status: 200,
  //     headerContains: ['Content-Type', 'json']
  //   }
  // }
  cases: [],
  // 公共设置，一般是权限token之类的
  globals: null,
  // 保存钩子下来。钩子会在某些时候起作用
  hooks: {}
};

// 开始执行
Restspec.prototype.initialize = function(opts) {
  this.options = _.defaults(opts, this.options);
  if (this.options.globals
        && this.options.globals.request
        && this.options.globals.request.headers) {
    this.options.headers = this.options.globals.request.headers;
  }
};

// 测试单个用例
Restspec.prototype.testCase = function(_case, callback) {
  if (!_case) {
    return callback();
  }
  // 创建一个测试
  var options = {
    url: this.options.urlRoot + _case.uri,
    method: _case.verb || 'GET',
    headers: Object.assign({}, this.options.headers, _case.headers),
    json: true,
  };
  if (_case.data) options.body = _case.data;
  if (_case.formData) options.formData = _case.formData;
  request(options, function(error, res, body) {
    var hasError = false
      , k;
    if (error) {
      this.error(error, _case);
      return callback()
    }
    last.res = res;
    last.body = body;
    for (k in _case.expects) {
      try {
        this['assert' + k](_case.expects[k], res)
      } catch(e) {
        if (inMocha) {
          process.stdout.write('\nCase: ' + JSON.stringify(_case, null, 2));
          process.stdout.write('\nHeaders: ' + JSON.stringify(res.headers, null, 2));
          process.stdout.write('\nStatusCode: ' + res.statusCode);
          process.stdout.write('\nBody: ' + JSON.stringify(body, null, 2));
          return callback(e);
        }
        hasError = true;
      }
    }
    if (inMocha) return callback();
    if (hasError) {
      this.failures += 1;
      process.stdout.write('F');
      process.stdout.write('\n' + this.failures + ')' + _case.name);
      process.stdout.write('\nExpects: ' + JSON.stringify(_case.expects, null, 2));
      process.stdout.write('\nStatusCode: ' + res.statusCode);
      process.stdout.write('\nHeaders: ' + JSON.stringify(res.headers, null, 2));
      process.stdout.write('\nBody: ' + JSON.stringify(body, null, 2));
    } else {
      process.stdout.write('.');
    }
    callback()
  }.bind(this));
};

Restspec.prototype.error = function(error, _case) {
  console.error(error.message);
};

Restspec.prototype.equal = function(actual, expected) {
  this.assertions += 1;
  if (_.isFunction(expected)) {
    expected(actual, assert);
  } else {
    assert.equal(actual, expected);
  }
};

Restspec.prototype.typeEqual = function(actual, expected) {
  if (actual == null) return;
  this.assertions += 1;
  if (_.isFunction(expected)) {
    expected(actual, assert);
  } else {
    assert.equal(actual instanceof expected, true);
  }
};

Restspec.prototype.assertStatus = function(expect, res) {
 this.equal(+res.statusCode, expect);
};

Restspec.prototype.assertHeader = function(expect, res) {
  this.equal(res.headers[expect[0].toLowerCase()], expect[1]);
};

Restspec.prototype.assertHeaders = function(expect, res) {
  expect.map(function(header) {
    this.assertHeader(header, res);
  }.bind(this));
};

Restspec.prototype.assertJSON = function(expect, res) {
  if (!_.isArray(expect)) {
    this.assertObject(res.body, expect);
  } else {
    if (expect[0] === '*') {
      _.each(res.body, function(v) {
        this.assertObject(v, expect[1]);
      }.bind(this))
    } else {
      this.assertObject(res.body[expect[0]], expect[1])
    }
  }
};

Restspec.prototype.assertJSONTypes = function(expect, res) {
  if (!_.isArray(expect)) {
    this.assertObjectTypes(res.body, expect);
  } else {
    if (expect[0] === '*') {
      _.each(res.body, function(v) {
        this.assertObjectTypes(v, expect[1]);
      }.bind(this))
    } else {
      this.assertObjectTypes(res.body[expect[0]], expect[1])
    }
  }
};

Restspec.prototype.assertJSONLength = function(expect, res) {
  this.equal(res.body.length, expect);
};

Restspec.prototype.assertObject = function(actual, expect) {
  if (_.isObject(expect) && !_.isFunction(expect)) {
    _.each(expect, function(v, k) {
      this.assertObject(actual[k], v);
    }.bind(this))
  } else {
    this.equal(actual, expect);
  }
};

Restspec.prototype.assertObjectTypes = function(actual, expect) {
  if (_.isObject(expect) && !_.isFunction(expect)) {
    _.each(expect, function(v, k) {
      this.assertObjectTypes(actual[k], v);
    }.bind(this))
  } else {
    this.typeEqual(actual, expect);
  }
};

Restspec.prototype.stats = function() {
  if (inMocha) return _.pick(this, ['tests', 'assertions', 'failures', 'skipped']);
  return [
    [this.tests, "tests"],
    [this.assertions, "assertions"],
    [this.failures, "failures"],
    [this.skipped, "skipped"]
  ].map(function(x) { return x.join(' ') }).join(', ');
};

// 测试执行完毕
Restspec.prototype.done = function() {
  if (!inMocha) {
    process.stdout.write('\n\n');
    console.log("Finished " + this.consumed() + " in seconds")
    console.log(this.stats(), '\n\n');
  }
  if(this.options.hooks.done) {
    this.options.hooks.done(this.stats());
  }
};

Restspec.prototype.consumed = function() {
  return (new Date() - this.startedAt) / 1000;
};

// 执行cases
Restspec.prototype.run = function() {
  this.tests = this.options.cases.length;
  _.each(this.options.cases, function(_case, index) {
    var caseName;

    // 判断_case如果是方法，调用传入上个测试的结果获取case
    if (typeof _case !== 'function') {
      caseName = _case.name;
    } else {
      caseName = 'The test case is function ' + index;
    }

    it(caseName, function(done) {
      if (typeof _case !== 'function') return this.testCase(_case, done);
      _case = _case(last.body, last.res);
      if (_case.then && _case.catch) {
        return _case.then(function(_case) {
          this.testCase(_case, done);
        }.bind(this)).catch(function(e) {
          done();
        });
      } else {
        this.testCase(_case, done);
      }
    }.bind(this));
  }.bind(this));
  it("The last one test case", function(done) {
    assert.ok(true);
    this.done();
    done()
  }.bind(this));
  if (!inMocha) execQueue();
};

module.exports = Restspec;
