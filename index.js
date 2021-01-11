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
  return fs.readdirSync(path.join("./", year)).map((v, k) => {
    const filename = path.basename(v, ".md");
    return { text: `第${k + 1}期：${filename}`, link: `/${year}/${filename}` };
  });
}

function genSidebar(dir, className) {
  return dir
    .map(
      (v) =>
        `<a target="_self" class="${className}" href="/weekly${v.link}">${v.text}</a>`
    )
    .join("");
}

router.get("/:year?/:date?", (ctx, next) => {
  const { date, year } = ctx.params;

  if (date) {
    const text = fs
      .readFileSync(path.join("./", year, date + ".md"))
      .toString();
    const tree = md.parse(text);

    ctx.body = nunjucks.renderString(getTempl(), {
      sidebar: genSidebar(getDateDir(year)),
      content: `<div class="year">${tree[1][2]}</div>${tree
        .map((v, k) => {
          return k > 1
            ? `<p class="para">${v[1]}</p><a target="_blank" href=${v[3]}>${v[3]}</a>`
            : "";
        })
        .join("")}`,
    });
  } else if (year) {
    ctx.body = nunjucks.renderString(getTempl(), {
      sidebar: genSidebar(getYearDir()),
      content: `<div class="year">${year}</div>${genSidebar(
        getDateDir(year),
        "date"
      )}`,
    });
  } else {
    const yearDir = getYearDir();
    ctx.body = nunjucks.renderString(getTempl(), {
      sidebar: genSidebar(yearDir),
      content: `<div class="year">前端小报</div>${genSidebar(yearDir, "date")}`,
    });
  }
});

app.use(router.routes());

app.listen(3009);
