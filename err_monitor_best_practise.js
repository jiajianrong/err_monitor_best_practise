var Koa = require('koa');
var app = new Koa();


var traceInfo = str => console.log(`traceInfo: ${str}`);
var traceEntry = str => console.log(`traceEntry: ${str}`);
var traceEnd = str => console.log(`traceEnd: ${str}`);
var traceError = err => console.log(`traceError: ${err.name}, ${err.message}`);


class NetworkError extends Error { name = 'NetworkError'; }
class ResponseError extends Error { name = 'ResponseError'; }
class RequestError extends Error { name = 'RequestError'; }
class JsonError extends Error { name = 'JsonError'; }



//----------------
// 作为一个标准库，
// 遇到错误时不要处理，
// 仅throw即可
//----------------
var fetch = async (rtnTime, isSucc) => {
	function _f () {
		return new Promise((res, rej) => {
			setTimeout(() => {
				var rtnStr = `${rtnTime},${isSucc}`;
				if (isSucc) res(rtnStr); else rej(rtnStr);
			}, rtnTime)
		});
	}	
	try {
		return await _f(rtnTime, isSucc);
	} catch (err) {
		throw new NetworkError(err);
	}
}



//-----------------
// 处理了err之后的fetch逻辑，
// 可以放心在Promise.all中使用
//-----------------
var fetchWithFail = async () => {
	try {
		return await fetch(1000, false);
	} catch (err) {
		traceError(err);
		return `fetchWrong: ${err.message}`;
	}
}



//-----------------
// 最直观的记录日志
//-----------------
if (0)
app.use(async function(ctx, next) {
    traceInfo(`req.url: ${ctx.url}`);
    ctx.body = '111';
	traceInfo(`result: ${ctx.body}`);
});



//-----------------
// 加入日志中间件
//-----------------
if (0)
app.use(async function(ctx, next) {
    traceEntry(`req.url: ${ctx.url}`);
    await next();
	traceEnd(`result: ${ctx.body}`);
});
if (0)
app.use(async function(ctx, next) {
	ctx.body = '222';
});



//-----------------
// 加入日志中间件、Err中间件
//-----------------
if (0)
app.use(async function(ctx, next) {
    traceEntry(`req.url: ${ctx.url}`);
    await next();
	traceEnd(`result: ${ctx.body}`);
});
if (0)
app.use(async function(ctx, next) {
	try {
		await next();
	} catch (err) {
		traceError(err);
		ctx.body = `Sorry, ${err.message}`;
	}
});
if (0)
app.use(async function(ctx, next) {
	let x = {};
	ctx.body = x.y.z;
});



//-----------------
// 加入日志中间件、Err中间件，和流程逻辑
//-----------------

app.use(async function(ctx, next) {
    traceEntry(`req.url: ${ctx.url}`);
    await next();
	traceEnd(`result: ${ctx.body}`);
});
app.use(async function(ctx, next) {
	try {
		await next();
	} catch (err) {
		traceError(err);
		ctx.body = `Sorry, ${err.message}`;
	}
});
app.use(async function(ctx, next) {
	traceInfo('日志1');
	let results = await Promise.all([
		fetch(100, true),
		fetch(1000, false), //fetchWithFail(),
	]);
	// Promise.all错误时不会打印 日志2
	traceInfo('日志2');
	ctx.body = results;
});



app.listen(80);