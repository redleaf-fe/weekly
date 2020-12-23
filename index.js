const serve = require("./node_modules/docsify-cli/lib/commands/serve.js");
const path = require("path");

serve(path.join("./"), 3009);
