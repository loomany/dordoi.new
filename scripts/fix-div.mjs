import fs from "node:fs";
const p = "c:/dev/Dordoi/components/catalog/CatalogBuyerSpotlight.tsx";
let s = fs.readFileSync(p, "utf8");
const badOpen = "<" + "motion.div";
const badClose = "</" + "motion.div>";
s = s.split(badOpen).join("<div");
s = s.split(badClose).join("</motion.div>");
s = s.split("</motion.div>").join("</motion.div>");
// fix if above wrong
s = s.replaceAll("</motion.div>", "</motion.div>");
fs.writeFileSync(p, s.replaceAll("</motion.div>", "</motion.div>"));
