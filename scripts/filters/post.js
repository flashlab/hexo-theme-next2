/* global hexo */

'use strict';

const { parse } = require('url');
const { encodeURL, unescapeHTML } = require('hexo-util');

hexo.extend.filter.register('marked:renderer', renderer => {
  const { config, theme } = hexo;
  const originalImgRender = renderer.image;
  renderer.image = (...args) => {
    //let content = originalImgRender.apply(renderer, args);
    // const href = args[0];
    if (!/^(#|\/\/|http(s)?:)/.test(args[0]) && config.marked.prependRoot) {
      // skip postPath option
      args[0] = config.pic_cdn_url + args[0]
    }
    let out = `<img ${theme.config.lazyload ? 'data-src' : 'src'}="${encodeURL(args[0])}"`
    if (args[2]) out += ` alt="${args[2]}"`
    if (args[1]) {
      const [size, ...titl] = args[1].split(' ')
      const matched = size.match(/^(\d+)x(\d+)$/, size)
      if (matched) {
        out += ` width="${matched[1]}" height="${matched[2]}" style="aspect-ratio: ${matched[1]} / ${matched[2]};"`
        args[1] = titl.join(' ')
      }
      if (args[1]) out += ` title="${args[1]}"`
    };
    if (config.marked.lazyload) out += ' loading="lazy"';

    out += '>';
    if (config.marked.figcaption && args[2]) {
      return `<figure>${out}<figcaption aria-hidden="true">${args.join(' ')}</figcaption></figure>`;
    }
    return out;
  };
  if (theme.config.exturl) {
    const siteHost = parse(config.url).hostname || config.url;
    // External URL icon
    const exturlIcon = theme.config.exturl_icon ? '<i class="fa fa-external-link-alt"></i>' : '';
    const originalUrlRender = renderer.link;
    renderer.link = (...args) => {
      let content = originalUrlRender.apply(renderer, args);
      return content.replace(/<a[^>]*\shref="([^"]+)"[^>]*>([^<]+)<\/a>/ig, (match, href, html) => {
        // Exit if the href attribute doesn't exist.
        if (!href) return match;
  
        // Exit if the url has same host with `config.url`, which means it's an internal link.
        const link = parse(href);
        if (!link.protocol || link.hostname === siteHost) return match;
  
        // Return encrypted URL with title.
        const title = match.match(/title="([^"]+)"/);
        const encoded = Buffer.from(unescapeHTML(href)).toString('base64');
        if (title) return `<span class="exturl" data-url="${encoded}" title="${title[1]}">${html}${exturlIcon}</span>`;
  
        return `<span class="exturl" data-url="${encoded}">${html}${exturlIcon}</span>`;
      });
    }
  }
}, 99);

//hexo.extend.filter.register('after_post_render', data => { }, 0);