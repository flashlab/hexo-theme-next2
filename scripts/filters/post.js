/* global hexo */

'use strict';

const { parse } = require('url');
const { encodeURL, unescapeHTML } = require('hexo-util');
const { config, theme } = hexo;
const preRegex = /<pre><code.*?<\/code><\/pre>/igs
const figRegex = /<figure\sclass=(.*?)>(.*?)<\/figure>/igs
const isWrap = config.highlight.line_number || config.highlight.wrap

hexo.extend.filter.register('marked:renderer', renderer => {
  const originalTblRender = renderer.table;
  renderer.image = (...args) => {
    // ![alt](/filename.webp?size=widthxheight "title|inline")
    // const href = args[0], title = args[1], alt = args[2];
    if (!/^(#|\/\/|http(s)?:)/.test(args[0])) {
      // skip postPath option
      args[0] = config.pic_cdn_url + args[0]
    }
    let out = ''
    const arrurl = args[0].split('?')
    let isInline = false
    if (arrurl.length > 1) {
      try {
        const param = new URLSearchParams(arrurl[1])
        const matched = param?.get('size')?.match(/^(\d+)x(\d+)$/)
        if (matched) {
          out += ` width="${matched[1]}" height="${matched[2]}" style="aspect-ratio: ${matched[1]} / ${matched[2]};"`
          param.delete('size')
        }
        const classname = decodeURI(param?.get('class') ?? '')
        if (classname) {
          out += ` class="${classname}"`
          param.delete('class')
          isInline = classname.split(' ').includes('inline')
        }
        args[0] = `${arrurl[0]}?${param.toString()}`
      } catch  { }
    }
    if (args[1]) out += ` title="${args[1]}"` 
    if (args[2]) out += ` alt="${args[2]}"`
    if (config.marked.lazyload) out += ' loading="lazy"';
    out = `<img ${theme.config.lazyload ? 'data-src' : 'src'}="${encodeURL(args[0])}"${out}>`
    if (config.marked.figcaption && args[2] && !isInline) {
      return `<figure>${out}<figcaption aria-hidden="true">${args[2]}</figcaption></figure>`
    }
    return out;
  };
  renderer.table = (...args) => {
    let content = originalTblRender.apply(renderer, args);
    return `<div class="table-container">${content}</div>`
  };
  if (theme.config.exturl) {
    const siteHost = parse(config.url).hostname || config.url;
    const originalUrlRender = renderer.link;
    renderer.link = (...args) => {
      let content = originalUrlRender.apply(renderer, args);
      return content.replace(/<a[^>]*\shref="([^"]+)"[^>]*>([^<]+)<\/a>/ig, (match, href, html) => {
        // Exit if the href attribute doesn't exist.
        if (!href) return match;
  
        // Exit if the url has same host with `config.url`, which means it's an internal link.
        const link = parse(href);
        if (!link.protocol || link.hostname === siteHost) return match;

        // External URL icon
        let iconClass = 'fa fa-external-link-square';
        if (/wikipedia\.org/i.test(link.hostname)) iconClass = 'fab fa-wikipedia-w fa-2xs'
        if (/github\.com/i.test(link.hostname)) iconClass = 'fab fa-github'
        if (/reddit\.com/i.test(link.hostname)) iconClass = 'fab fa-reddit'
        const exturlIcon = theme.config.exturl_icon ? `<sup class="${iconClass}"></sup>` : '';
  
        // Return encrypted URL with title.
        const title = match.match(/title="([^"]+)"/);
        const encoded = Buffer.from(unescapeHTML(href)).toString('base64');
        if (title) return `<span class="exturl" data-url="${encoded}" title="${title[1]}">${html}${exturlIcon}</span>`;
  
        return `<span class="exturl" data-url="${encoded}">${html}${exturlIcon}</span>`;
      });
    }
  }
}, 99);

hexo.extend.filter.register('after_post_render', data => {
  let suffix = ''
  if (theme.config.codeblock.fold.enable) suffix += '<div class="fold-cover"></div><div class="expand-btn"><i class="fa fa-angle-down fa-fw"></i></div>'
  if (theme.config.codeblock.copy_button.enable) suffix += '<div class="copy-btn"><i class="fa fa-copy fa-fw"></i></div>'
  if (!isWrap) {
    data.content = data.content.replace(preRegex, '<div class="code-container notranslate">$&'+suffix+'</div>')
  } else if (suffix) {
    data.content = data.content.replace(figRegex, (ori, cls, inn) => {
      if (!['highlight', 'hljs'].some(cl => cls.includes(cl))) return ori;
      return `<figure class=${cls}>${inn}${suffix}</figure>`
    })
  }
  return data
}, 0);