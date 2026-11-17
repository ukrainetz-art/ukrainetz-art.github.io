import { HtmlBasePlugin } from "@11ty/eleventy";
import markdownIt from "markdown-it";

const md = markdownIt({ html: true, breaks: false, linkify: true, typographer: false });

export default function (eleventyConfig) {
  // All links in templates are written from the site root ("/about.html").
  // HtmlBasePlugin adds the GitHub Pages sub-path (e.g. "/painter") at build time.
  eleventyConfig.addPlugin(HtmlBasePlugin);

  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/media": "media" });
  eleventyConfig.addPassthroughCopy({ "src/favicon.ico": "favicon.ico" });
  eleventyConfig.addPassthroughCopy({ "src/admin/index.html": "admin/index.html" });

  // Content files are read by src/_data/content.js; rebuild when they change.
  eleventyConfig.addWatchTarget("src/content/");
  eleventyConfig.ignores.add("src/content/**");

  eleventyConfig.addFilter("md", (s) => md.render(s || ""));
  eleventyConfig.addFilter("mdInline", (s) => md.renderInline(s || ""));
  eleventyConfig.addFilter("json", (v) => JSON.stringify(v));
  eleventyConfig.addFilter("dateFmt", (iso) => {
    const [y, m, d] = String(iso).split("-");
    return d && m && y ? `${d}.${m}.${y}` : iso;
  });

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    templateFormats: ["njk"],
    htmlTemplateEngine: "njk",
    pathPrefix: process.env.PATH_PREFIX || "/",
  };
}
