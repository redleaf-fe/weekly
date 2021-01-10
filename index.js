const fs = require("fs");
const path = require("path");
const nunjucks = require("nunjucks");
const md = require("markdown").markdown;

const koa = require("koa");
const router = require("koa-router")();

const app = new koa();

function getTempl() {
  return fs.readFileSync(path.join("./index.html")).toString();
}

function getYearDir() {
  return fs.readdirSync(path.join("./sidebar")).map((v) => {
    const filename = path.basename(v, ".md");
    return { text: filename, link: `/${filename}` };
  });
}

function getDateDir(year) {
  return fs.readdirSync(path.join("./", year)).map((v) => {
    const filename = path.basename(v, ".md");
    return { text: filename, link: `/${year}/${filename}` };
  });
}

function genSidebar(dir) {
  return dir
    .map((v) => `<a target="_self" href=${v.link}>${v.text}</a>`)
    .join("");
}

router.get("/:year?/:date?", (ctx, next) => {
  const { date, year } = ctx.params;

  if (date) {
    const text = fs
      .readFileSync(path.join("./", year, date + ".md"))
      .toString();
    const tree = md.parse(text);
    console.log(tree);

    ctx.body = nunjucks.renderString(getTempl(), {
      sidebar: genSidebar(getDateDir(year)),
      content: `<div class="year">${tree[1][2]}</div>${tree
        .map((v, k) => {
          console.log(v)
          return k > 1
            ? `<p class="para">${v[1]}</p><a target="_blank" href=${v[3]}>${v[3]}</a>`
            : "";
        })
        .join("")}`,
    });
  } else if (year) {
    ctx.body = nunjucks.renderString(getTempl(), {
      sidebar: genSidebar(getYearDir()),
      content: `<div class="year">${year}</div>${getDateDir(year)
        .map((v, k) => `<a class="date" target="_self" href=${v.link}>第${k + 1}期：${v.text}</a>`)
        .join("")}`,
    });
  } else {
    ctx.body = nunjucks.renderString(getTempl(), {
      sidebar: genSidebar(getYearDir()),
      content: `<div class="year">redleaf weekly</div>`,
    });
  }
});

app.use(router.routes());

app.listen(3009);
