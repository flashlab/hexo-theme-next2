'use strict';

const fs = require('fs');
const path = require('path');
const { encodeURL } = require('hexo-util');

let css;
try {
  css = require('@adobe/css-tools');
} catch {
  css = require('css');
}

function resolve(name, file = '') {
  let dir;
  try {
    dir = path.dirname(require.resolve(`${name}/package.json`));
  } catch {
    return '';
  }
  return `${dir}/${file}`;
}

function highlightTheme(name) {
  const file = resolve('highlight.js', `styles/${name}.css`);
  const content = fs.readFileSync(file, 'utf8');

  let background = '';
  let foreground = '';
  css.parse(content).stylesheet.rules
    .filter(rule => rule.type === 'rule' && rule.selectors.some(selector => selector.endsWith('.hljs')))
    .flatMap(rule => rule.declarations)
    .forEach(declaration => {
      if (declaration.property === 'background' || declaration.property === 'background-color') background = declaration.value;
      else if (declaration.property === 'color') foreground = declaration.value;
    });
  return {
    file,
    background,
    foreground
  };
}

function getVendors({ name, alias, version, file, minified, local, custom }) {
  // Make it possible to set `cdnjs_name` and `cdnjs_file` in `custom_cdn_url`
  const npm_name = name;
  const cdnjs_name = alias || name;
  const npm_file = file;
  const cdnjs_file = minified.replace(/^(dist|lib|source\/js|)\/(browser\/|)/, '');
  const value = {
    npm_name,
    cdnjs_name,
    version,
    npm_file,
    minified,
    cdnjs_file
  };
  return {
    local,
    jsdelivr: `https://cdn.jsdelivr.net/npm/${npm_name}@${version}/${minified}`,
    unpkg   : `https://unpkg.com/${npm_name}@${version}/${npm_file}`,
    cdnjs   : `https://cdnjs.cloudflare.com/ajax/libs/${cdnjs_name}/${version}/${cdnjs_file}`,
    custom  : (custom || '').replace(/\$\{(.+?)\}/g, (match, $1) => value[$1])
  };
}
/**
 * Parse markdown image like ![alt](/filename.webp?size=widthxheight&class=emoji "title")
 * @param {args.href} : url
 * @param {args.title} : title
 * @param {args.text} : alt/figcaption, if start with `:` will hide caption
 * @param {args.nocap} : force hide caption
 * @returns html string
 */
function parseLink(args) {
  let out = ''
  const { config, theme } = this;

  args.href = decodeURI(args.href.trim());
  if (!/^(#|\/\/|http(s)?:)/.test(args.href)) args.href = (config.pic_cdn_url ?? '') + args.href
  // patch old post with emoji
  if (args.href.includes('/emoji/') && !args.text?.startsWith(':')) {
    args.text = `:${args.href.split('/').pop().split('.')[0]}:`;
  }
  const arrurl = args.href.split('?')
  if (arrurl.length > 1) {
    try {
      const param = new URLSearchParams(arrurl[1])
      const matched = param?.get('size')?.match(/^(\d+)x(\d+)$/)
      if (matched) {
        out += ` decoding="async" crossorigin="anonymous" width="${matched[1]}" style="aspect-ratio: ${matched[1]} / ${matched[2]};"` //  remove width="${matched[1]}" to enable max-height
        param.delete('size')
      }

      const classname = param?.get('class') || ''
      if (classname) {
        out += ` class="${clas}"`
        param.delete('class')
      }
      args.href = arrurl[0] + (param.size > 0 ? `?${param.toString()}` : '')
    } catch  { }
  }
  // hide caption if is start with by [:].
  if (args.text?.startsWith(':')) args.nocap = true

  if (args.title) out += ` title="${args.title}"` 
  if (args.text) out += ` alt="${args.text}"`
  if (config.marked.lazyload) out += ' loading="lazy"';

  out = `<img ${theme.lazyload ? 'data-src' : 'src'}="${encodeURL(args.href)}"${out}>`
  if (config.marked.figcaption && args.text && !args.nocap) {
    return `<figure>${out}<figcaption aria-hidden="true">${args.text}</figcaption></figure>`
  }
  return out;
}

const points = {
  views: [
    'head',
    'header',
    'sidebar',
    'postMeta',
    'postBodyStart',
    'postBodyEnd',
    'footer',
    'bodyEnd',
    'comment'
  ],
  styles: [
    'variable',
    'mixin',
    'style'
  ]
};

// Required by theme-next-docs and @next-theme/plugins
module.exports = {
  resolve,
  highlightTheme,
  getVendors,
  points,
  parseLink
};
