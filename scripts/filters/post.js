/* global hexo */

'use strict';

const { parse } = require('url');
const { unescapeHTML } = require('hexo-util');

hexo.extend.filter.register('marked:renderer', renderer => {
  const { config, theme } = hexo;
  if (theme.config.lazyload) {
    const originalImgRender = renderer.image;
    renderer.image = (...args) => {
      let content = originalImgRender.apply(renderer, args);
      // const href = args[0];
      return content.replace('src="/.', 'src="' + theme.config.vendors.pic_cdn_url).replace('src="', 'data-src="');
    };
  }
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