/* global hexo */

'use strict';

const { parse } = require('url');
const { unescapeHTML } = require('hexo-util');
const { config, theme } = hexo;
const { parseLink } = require('../events/lib/utils');
const preRegex = /<pre><code.*?<\/code><\/pre>/igs
const figRegex = /<figure\sclass=(.*?)>(.*?)<\/figure>/igs
const isWrap = config.highlight.line_number || config.highlight.wrap

hexo.extend.filter.register('marked:renderer', renderer => {
  const originalTblRender = renderer.table;
  renderer.image = (...args) => {
    // ![alt](/filename.webp?size=widthxheight&class=inline "title")
    return parseLink.bind(hexo)(args)
  };
  renderer.table = (...args) => {
    let content = originalTblRender.apply(renderer, args);
    return `<div class="table-container">${content}</div>`
  };
  if (theme.config.exturl) {
    const siteHost = parse(config.url).hostname || config.url;
    const originalUrlRender = renderer.link;
    const iconSup = new Map([['wikipedia\.org', 'fa-wikipedia-w fa-2xs'],
                             ['github\.com', 'fa-github'],
                             ['reddit\.com', 'fa-reddit'],
                             ['weixin\.qq\.com', 'fa-weixin'],
                             ['cloud\.189\.cn|pan\.baidu\.com', 'fa-google-drive'],
                            ])
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
        for (const [reg, fax] of iconSup) {
          const re = new RegExp(reg, 'i');
          if (re.test(link.hostname)) {
            iconClass = 'fab ' + fax;
            break;
          }
        }
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

hexo.extend.filter.register('marked:extensions', extensions => {
  extensions.push({
    name: 'livePhoto',
    level: 'block',
    start(src) {
      return src.match(/!\[(.*?)\]/)?.index
    },
    tokenizer(src) {
      const cap = /^!\[([^\]]*?)\]\(([^)\s]+?(?:size\=(\d+)x(\d+))?)(?:\s([^)]*?))?\)\(([^)]*?)\)/.exec(src);
      if (cap !== null) {
        return {
          type: 'livePhoto',
          raw: cap[0],
          imageSrc: [cap[2], cap[5], cap[1]],
          videoSrc: cap[6]?.startsWith('/') ? config.pic_cdn_url + cap[6] : cap[6],
          ratio: cap[3] + ' / ' + cap[4],
        };
      }
      return undefined;
    },
    renderer(token) {
      return `
      <div class="livePhotoContainer" style="aspect-ratio: ${token.ratio}">
        <video src="${token.videoSrc}" playsinline preload="none"></video>
        ${parseLink.bind(hexo)(token.imageSrc)}
        <div class="icon">
          <svg width="1.2em" height="1.2em" data-value="0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 1.3v.01m-3.66.64v.01m7.32-.01v.01M5.12 3.8v.01m13.76-.01v.01M2.73 6.65v.01m18.54-.01v.01M1.46 10.14v.01m21.08-.01v.01m-21.07 3.7v.01m21.06 0v.01M2.74 17.34v.01m18.52 0v.01M5.12 20.19v.01m13.75-.01v.01M8.34 22.05v.01m7.31-.01v.01m-3.65.63v.01" />
            <circle cx="12" cy="12" r="7.25" stroke-width="1.5" />
            <path d="M10.47 14.06V9.94L14.05 12z" fill="currentColor" />
            <circle cx="-12" cy="12" r="10.69" stroke-dashoffset="67.167" stroke-dasharray="67.167" transform="rotate(-90)" stroke-width="2.1" />
          </svg>
          <span>LIVE</span><span class="msg"></span>
        </div>
      </div>
      `
    }
    /*  // for livephotosKit JS
    tokenizer(src) {
      const cap = /^!\[(.*?)\]\(([^)]*?(?:size\=(\d+)x(\d+))?)\)\(([^)]*?(?:stamp\=(\d+))?)\)/.exec(src);

      if (cap !== null) {
        return {
          type: 'livePhoto',
          raw: cap[0],
          text: cap[0]?.trim(),
          label: cap[1],
          photoSrc: !cap[2]?.startsWith('http') ? config.pic_cdn_url + cap[2] : cap[2],
          videoSrc: !cap[5]?.startsWith('http') ? config.pic_cdn_url + cap[5] : cap[5],
          width: cap[3],
          height: cap[4],
          stamp: cap[6]
        };
      }

      return undefined;
    },
    renderer(token) {
      return `
        <figure>
          <div class='livePhotoContainer'
              style='height: ${token.height ?? 600}px'
              data-live-photo
              data-effect-type='live'
              data-playback-style='full'
              data-proactively-loads-video='false'
              data-photo-src='${token.photoSrc}'
              data-video-src='${token.videoSrc}'
              ${token.stamp ? "data-photo-time=" + token.stamp : ""}
          ></div>
          <figcaption>${token.label}</figcaption>
        </figure>
      ` 
    }*/
  });
});

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