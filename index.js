const fs = require('fs');
const path = require('path');
const querystring = require('querystring');
const nunjucks = require('nunjucks');
const md = require('markdown').markdown;
const cache = require('./cache');

const http = require('http');
const koa = require('koa');
const router = require('koa-router')();

const pkg = require('./package.json');

const __dev__ = false;

const app = new koa();

initCache();

function initCache() {
  // 设置缓存初始值
  cache.set('template', getTempl());
  const yearDir = getYearDir();
  cache.set('year', yearDir);

  let titleAll = [];
  yearDir.forEach((year) => {
    const dateDir = getDateDir(year);
    cache.set(`date_${year}`, dateDir);
    dateDir.forEach((date) => {
      const title = getTitle(year, date);
      titleAll = titleAll.concat(title);
      cache.set(`title_${year}_${date}`, title);
      cache.set(`article_${year}_${date}`, getArticle(year, date));
    });
  });

  cache.set(`allTitle`, titleAll);
}

function getCache(key, fn) {
  return cache.get(key, fn);
}

function getTempl() {
  return fs.readFileSync(path.resolve('./index.html')).toString();
}

function getYearDir() {
  return fs.readdirSync(path.resolve('./sidebar')).map((v) => {
    const filename = path.basename(v, '.md');
    return filename;
  });
}

function getYearDirText() {
  return getCache('year', getYearDir).map((v) => {
    return { text: v, link: `/${v}` };
  });
}

function getDateDir(year) {
  return fs.readdirSync(path.join('./', year)).map((v, k) => {
    const filename = path.basename(v, '.md');
    return filename;
  });
}

function getDateDirText(year) {
  return getCache(`date_${year}`, () => getDateDir(year)).map((v, k) => {
    return { text: `第${k + 1}期：${v}`, link: `/${year}/${v}` };
  });
}

function getArticle(year, date) {
  const text = fs.readFileSync(path.join('./', year, date + '.md')).toString();
  const tree = md.parse(text);

  return `<div class="year">${tree[1][2]}</div>${tree
    .map((v, k) => {
      return k > 1
        ? `<p class="para">${v[1]}</p><a target="_blank" href=${v[3]}>${v[3]}</a>`
        : '';
    })
    .join('')}`;
}

function getTitle(year, date) {
  const text = fs.readFileSync(path.join('./', year, date + '.md')).toString();
  const tree = md.parse(text);

  return tree
    .map((v, k) => {
      return k > 1 ? `<a target="_blank" href=${v[3]}>${v[1]}</a>` : '';
    });
}

function genSidebar(dir, className = '') {
  return dir
    .map(
      (v) =>
        `<a target="_self" class="${className}" href="${
          __dev__ ? '' : '/weekly'
        }/catalog${v.link}">${v.text}</a>`
    )
    .join('');
}

// 路由 =============================================================
router.get('/', (ctx, next) => {
  const yearDir = getYearDirText();
  ctx.body = nunjucks.renderString(getCache('template', getTempl), {
    sidebar: genSidebar(yearDir),
    content: `<div class="year">前端小报</div>${genSidebar(yearDir, 'date')}`,
  });
});

router.get('/search', (ctx, next) => {
  const searchWord = querystring.parse(ctx.url.split('?')[1]).param;

  function getAllTitle() {
    let titleAll = [];
    getCache('year', getYearDir).forEach((year) => {
      getCache(`date_${year}`, () => getDateDir(year)).forEach((date) => {
        titleAll = titleAll.concat(
          getCache(`title_${year}_${date}`, () => getTitle(year, date))
        );
      });
    });
    return titleAll;
  }

  if (searchWord) {
    const titles = getCache('allTitle', getAllTitle);
    const temp = titles.filter((v) => new RegExp(searchWord, 'ig').test(v));

    ctx.body = temp.join('');
  } else {
    ctx.body = '';
  }
});

router.get('/flush', (ctx, next) => {
  // const key = querystring.parse(ctx.url.split('?')[1]).param;
  initCache();
  ctx.body = 'ok';
});

router.get('/keys', (ctx, next) => {
  ctx.body = cache.keys();
});

router.get('/catalog/:year?/:date?', (ctx, next) => {
  const { date, year } = ctx.params;
  const sidebar = genSidebar(getYearDirText());

  if (date) {
    ctx.body = nunjucks.renderString(getCache('template', getTempl), {
      sidebar,
      content: getCache(`article_${year}_${date}`, () =>
        getArticle(year, date)
      ),
    });
  } else if (year) {
    ctx.body = nunjucks.renderString(getCache('template', getTempl), {
      sidebar,
      content: `<div class="year">${year}</div>${genSidebar(
        getDateDirText(year),
        'date'
      )}`,
    });
  }
});

app.use(router.routes());

app.callback();

const server = http.createServer(app.callback());
server.listen(pkg.port);

function handleSignal(signal) {
  server.close();
  cache.clear();
  process.exit(0);
}

process.on('SIGINT', handleSignal);
process.on('SIGTERM', handleSignal);
