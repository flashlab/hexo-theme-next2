/* global hexo */

'use strict';

const path = require('path');

// Add comment
hexo.extend.filter.register('theme_inject', injects => {
  const theme = hexo.theme.config;
  if (!theme.twikoo.enable) return;

  injects.comment.raw('twikoo', `
{%- if page.comments %}
  <div class="comments twikoo-container">
    <img src="/attach/dinosaur-{{ page.lang }}.png" alt="loading comments..." loading="lazy" width="120" height="120" class="inline"><br>
  </div>
{%- endif %}
  `,);

});
