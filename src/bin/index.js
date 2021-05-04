const tl_create = require("..");
module.exports = {
  getMicrosoftTrusted: parseMicrosoftTrusted,
  getMicrosoftDisallowed: parseMicrosoftDisallowed,
};

function parseMicrosoftTrusted() {
  console.log("Trust Lists: Microsoft");
  let ms = new tl_create.Microsoft();
  let tl = ms.getTrusted();
  return tl.Certificates;
}
function parseMicrosoftDisallowed() {
  console.log("Trust Lists: Microsoft");
  let ms = new tl_create.Microsoft();
  let tl = ms.getDisallowed();
  return tl.Certificates;
}
