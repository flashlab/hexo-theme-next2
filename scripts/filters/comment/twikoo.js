/* global hexo */

'use strict';

const path = require('path');

// Add comment
hexo.extend.filter.register('theme_inject', injects => {
  const theme = hexo.theme.config;
  if (!theme.twikoo.enable) return;

  injects.comment.raw('twikoo', `
{%- if page.comments %}
  <div class="reward-container">
    <a class="btn" href="javascript:;" title="Disqus"><i class="fa fa-comment-dots fa-fw fa-lg"></i>显示 Disqus 评论</a><sub> (非国内网络)</sub>
  </div>
  <div id="disqus_thread"></div>
  <div class="comments twikoo-container">
    <img src="/attach/dinosaur-{{ page.lang }}.png" alt="loading comments..." loading="lazy" width="120" height="120" class="inline"><br>
  </div>
{%- endif %}
  `,);

});
