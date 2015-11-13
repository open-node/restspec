var frisby  = require('frisby')
  , async   = require('async')
  , _       = require('underscore');

__bind = function(fn, me) {
  return function() {
    return fn.apply(me, arguments);
  };
};

function Restspec(opts) {
  this.initialize = __bind(this.initialize, this)
  this.run = __bind(this.run, this)
  this.testCase = __bind(this.testCase, this)
  this.done = __bind(this.done , this)
  this.initialize(opts);
  this.initGlobals();
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
};

// 初始化全局设定
Restspec.prototype.initGlobals = function() {
  frisby.globalSetup(this.options.globals);
};

// 测试单个用例
Restspec.prototype.testCase = function(memo, _case, callback) {
  // 判断_case如果是方法，调用传入上个测试的结果获取case
  if(typeof _case == 'function')
    _case = _case(memo.body, memo.res);
  // 创建一个测试
  var chain = frisby.create(_case.name || this.options.name)
    , params = {json: true}
    , verb = _case.verb || 'get'
    , argv = [this.options.urlRoot + _case.uri]
  if(verb !== 'get') {
    _case.data = _case.data || {};
  }
  if(_case.data) {
    argv.push(_case.data);
  }
  if(_case.headers) {
    params.headers = _case.headers
  }

  argv.push(params);
  chain = chain[verb].apply(chain, argv);

  // 断言开始
  _.each(_case.expects, function(value, key) {
    if(!_.isArray(value)) {
      value = [value];
    }
    chain = chain['expect' + key].apply(chain, value);
  });
  chain.after(function(error, res, body) {
    callback(null, {
      body: body,
      res: res
    });
  });

  // supper inspectJSON, debugger
  if(_case.inspectJSON) {
    chain.inspectJSON()
  }

  // supper inspectBody, debugger
  if(_case.inspectBody) {
    chain.inspectBody()
  }
  chain.toss();
};

// 测试执行完毕
Restspec.prototype.done = function(error) {
  if(this.options.hooks.done) {
    this.options.hooks.done(error);
  }
};

// 执行cases
Restspec.prototype.run = function() {
  async.reduce(this.options.cases, {}, this.testCase, this.done);
};

module.exports = Restspec;
