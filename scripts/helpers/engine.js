/* global hexo */

'use strict';

const crypto = require('crypto');
const { parse } = require('url');
const nextFont = require('./font');
const nextUrl = require('./next-url');
const { getVendors, parseLink } = require('../events/lib/utils');

hexo.extend.helper.register('next_font', nextFont);
hexo.extend.helper.register('next_url', nextUrl);

hexo.extend.helper.register('next_inject', function(point) {
  return this.theme.injects[point]
    .map(item => this.partial(item.layout, item.locals, item.options))
    .join('');
});

hexo.extend.helper.register('next_js', function(file, {
  pjax = false,
  module = false,
  attr = ''
} = {}) {
  const { next_version } = this;
  const { internal, custom_cdn_url } = this.theme.vendors;
  const links = getVendors({
    name    : 'hexo-theme-next',
    version : next_version,
    file    : 'source/js/' + file,
    minified: 'source/js/' + file.replace(/\.js$/, '.min.js'),
    local   : this.url_for(`${this.theme.js}/${file}`),
    custom  : custom_cdn_url
  });
  const src = links[internal] || links.local;
  return `<script ${pjax ? 'data-pjax ' : ''}${module ? 'type="module" ' : ''}${attr ? ` ${attr} ` : ''}src="${src}" defer></script>`;
});

hexo.extend.helper.register('next_vendors', function(name, prop='') {
  const { url, integrity } = this.theme.vendors[name];
  const type = url.endsWith('css') ? 'css' : 'js';
  if (integrity) prop += ` integrity="${integrity}" crossorigin="anonymous"`
  if (type === 'css') {
    return `<link${prop.includes('rel=') ? '' : 'rel="stylesheet"'} href="${url}"${prop}>`;
  }
  return `<script src="${url}"${prop}></script>`;
});

hexo.extend.helper.register('next_data', function(name, ...data) {
  const json = data.length === 1 ? data[0] : Object.assign({}, ...data);
  return `<script class="next-config" data-name="${name}" type="application/json">${
    JSON.stringify(json).replace(/</g, '\\u003c')
  }</script>`;
});

hexo.extend.helper.register('next_pre', function() {
  if (!this.theme.preconnect) return '';
  const { enable, host } = this.theme.font;
  const { internal, plugins, custom_cdn_url } = this.theme.vendors;
  const links = {
    local   : this.theme.js && parse(this.theme.js).hostname ? parse(this.theme.js).protocol + '//' + parse(this.theme.js).hostname : '',
    jsdelivr: 'https://cdn.jsdelivr.net',
    unpkg   : 'https://unpkg.com',
    cdnjs   : 'https://cdnjs.cloudflare.com',
    custom  : custom_cdn_url && parse(custom_cdn_url).hostname ? parse(custom_cdn_url).protocol + '//' + parse(custom_cdn_url).hostname : ''
  };
  const h = enable ? host || 'https://fonts.googleapis.com' : '';
  const i = links[internal];
  const p = links[plugins];
  return [...new Set([h, i, p].filter(origin => origin))].map(
    origin => `<link rel="preconnect" href="${origin}" crossorigin>`
  ).join('\n');
});

hexo.extend.helper.register('post_gallery', function(photos) {
  if (!Array.isArray(photos) || photos.length < 1) return '';
  return photos.reduce((acc, photo) => {
    let arr = photo.split(' ').slice(0, 3);
    const par = {}
    par.href = this.url_for(arr[0])
    par.title = arr[1] || null;
    par.text = arr[2] || null;
    par.nocap = true;
    const content = parseLink.bind(this)(par);
    return acc + (photos.length == 1 ? content : `<div class="post-gallery-image">${content}</div>`);
  }, '<div class="post-gallery" itemscope itemtype="http://schema.org/ImageGallery">') + '</div>';
});

hexo.extend.helper.register('post_banner', function(raw) {
  const rawlink = /!\[[^\]]*\]\(([^\s\)]+)[\s\)]/.exec(raw);
  if (rawlink === null) return '';
  return [rawlink[1]]
});

hexo.extend.helper.register('post_edit', function(src) {
  const { post_edit } = this.theme;
  if (!post_edit.enable) return '';
  return this.next_url(post_edit.url_edit + src, '<i class="fa fa-pen-nib"></i>', {
    class: 'post-edit-link',
    title: this.__('post.edit')
  }) + this.next_url(post_edit.url_new, '<i class="fa fa-lightbulb"></i>', {
    class: 'post-edit-link',
    title: 'new'
  });
});

hexo.extend.helper.register('post_count', function(year) {
  return this.site.posts.filter(post => this.date(post.date, 'YYYY') === year).count();
});

hexo.extend.helper.register('gitalk_md5', function(path) {
  const str = this.url_for(path);
  return crypto.createHash('md5').update(str).digest('hex');
});

/**
 * Get page path given a certain language tag
 */
hexo.extend.helper.register('i18n_path', function(language, page) {
  const { path, lang } = page ?? this.page
  const oldUrl = path.replace(/^\//, '')
  const base = oldUrl.startsWith(lang) ? oldUrl.slice(lang.length + 1) : oldUrl
  let newUrl = this.languages.indexOf(language) === 0 ? '' : language + '/'
  // fallback to root page if page not exists 
  if (!page) {
    const routerlist = hexo.route.list()
    //console.dir(routerlist, {'maxArrayLength': null})
    const fullurl = `${newUrl}${base}${base.endsWith('/') ? 'index.html' : ''}`
    if (routerlist.includes(fullurl)) newUrl += base
  } else {
    newUrl += base
  }
 // console.log([oldUrl, base, newUrl, fullurl].join(' | '))
  return this.url_for(newUrl)
});

/**
 * Get the language name
 */
hexo.extend.helper.register('language_name', function(language) {
  const name = hexo.theme.i18n.__(language)('name');
  return name === 'name' ? language : name;
});
