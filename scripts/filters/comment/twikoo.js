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
    <a class="btn" href="javascript:;" title="Disqus"><i class="fa fa-comment-dots fa-fw fa-lg"></i>{{ __('reward.show_disqus') }}</a>{%- if page.lang == 'zh-CN' %}<sub> (非国内网络)</sub>{%- endif %}
  </div>
  <div id="disqus_thread"></div>
  <style type="text/css">
    .twikoo .el-button.is-disabled {color: var(--btn-default-color); background-color: var(--btn-default-bg); pointer-events: none; opacity: 0.5;}
    .tk-icon.__comments, .tk-action-icon, .tk-action-link {color: var(--text-color)}
  </style>
  <div class="comments twikoo-container">
    <img src="/attach/dinosaur-{{ page.lang }}.png" alt="loading comments...:" loading="lazy" width="120" height="120"><br>
  </div>
{%- endif %}
  `,);

});
