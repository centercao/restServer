/**
 * Created by center on 17-2-24.
 */
var should = require('should');
var request = require('supertest');
const Koa = require('koa');
const app = new Koa();
const router = require('koa-router')();
const convert = require('koa-convert');
const json = require('koa-json');
const views = require('koa-views');
const bodyparser = require('koa-bodyparser');
app.use(convert(bodyparser()));
app.use(convert(json()));
app.use(views(__dirname + '/views', {
	extension: 'ejs'
}));
const users = require('../../routes/users');
router.use('/users', users.routes(), users.allowedMethods());
app.use(router.routes(), router.allowedMethods());

describe('router testing', function () {
	it('users have not id response', function (done) {
		request(app.listen())
			.get('/users')     //get方法
			.expect(200)                        //断言状态码为200
			.end((err, res) => {
				if (err) throw err;
				console.log("log:" + res.text);
				//断言data属性是一个对象
				// expect(res.body.data).to.be.an('object');
				
				done();
			});
		/*request(router)
			.get('/users')
			.expect('Content-Type', 'text/html; charset=utf-8')
			.expect(200)
			.end(function(err, res){
				if (err) throw err;
				should.exist(res.text);
				done();
			});*/
	});
});
