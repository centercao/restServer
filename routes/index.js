var router = require('koa-router')();

router.get('/', async function (ctx, next) {
 /* ctx.state = {
    title: 'koa2 title'
  };*/

 /* await ctx.render('index', {
  });*/
 ctx.body="Smart Home API Server";
});
module.exports = router;
