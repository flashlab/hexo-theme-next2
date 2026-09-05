/* global hexo */

'use strict';

const { config, theme } = hexo;
const preRegex = /<pre><code.*?<\/code><\/pre>/igs;
const figRegex = /<figure\sclass=(.*?)>(.*?)<\/figure>/igs;
const isWrap = config.highlight.line_number || config.highlight.wrap;

// Append fold-cover / expand-btn / copy-btn server-side into code blocks,
// pairing with the client-side registerCodeblock in source/js/utils.js.
hexo.extend.filter.register('after_post_render', data => {
  let suffix = '';
  if (theme.config.codeblock.fold.enable) suffix += '<div class="fold-cover"></div><div class="expand-btn"><i class="fa fa-angle-down fa-fw"></i></div>';
  if (theme.config.codeblock.copy_button.enable) suffix += '<div class="copy-btn"><i class="fa fa-copy fa-fw"></i></div>';
  if (!isWrap) {
    data.content = data.content.replace(preRegex, '<div class="code-container notranslate">$&' + suffix + '</div>');
  } else if (suffix) {
    data.content = data.content.replace(figRegex, (ori, cls, inn) => {
      if (!['highlight', 'hljs'].some(cl => cls.includes(cl))) return ori;
      return `<figure class=${cls}>${inn}${suffix}</figure>`;
    });
  }
  return data;
}, 0);
