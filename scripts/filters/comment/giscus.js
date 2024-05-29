/* global hexo */

'use strict';

const path = require('path');

// Add comment
hexo.extend.filter.register('theme_inject', injects => {
  const theme = hexo.theme.config;
  if (!theme.giscus.enable) return;

  injects.comment.raw('giscus', `
  {% if page.comments %}
  <div class="comments giscus-container">
  <img src="/attach/dinosaur.png" alt="loading comments..." loading="lazy" class="inline"><br>
  </div>
  {% endif %}
  `,);

});
