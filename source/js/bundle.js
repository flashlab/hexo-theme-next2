/* sidebar.js */
document.addEventListener('DOMContentLoaded', () => {

  const isRight = CONFIG.sidebar.position === 'right';

  const sidebarToggleMotion = {
    mouse: {},
    init() {
      window.addEventListener('mousedown', this.mousedownHandler.bind(this));
      window.addEventListener('mouseup', this.mouseupHandler.bind(this));
      document.querySelector('.sidebar-dimmer').addEventListener('click', this.clickHandler.bind(this));
      document.querySelector('.sidebar-toggle').addEventListener('click', this.clickHandler.bind(this));
      window.addEventListener('sidebar:show', this.showSidebar);
      window.addEventListener('sidebar:hide', this.hideSidebar);
    },
    mousedownHandler(event) {
      this.mouse.X = event.pageX;
      this.mouse.Y = event.pageY;
    },
    mouseupHandler(event) {
      const deltaX = event.pageX - this.mouse.X;
      const deltaY = event.pageY - this.mouse.Y;
      const clickingBlankPart = Math.hypot(deltaX, deltaY) < 20 && event.target.matches('.main');
      // Fancybox has z-index property, but medium-zoom does not, so the sidebar will overlay the zoomed image.
      if (clickingBlankPart || event.target.matches('img.medium-zoom-image')) {
        this.hideSidebar();
      }
    },
    clickHandler() {
      document.body.classList.contains('sidebar-active') ? this.hideSidebar() : this.showSidebar();
    },
    showSidebar() {
      document.body.classList.add('sidebar-active');
      const animateAction = isRight ? 'fadeInRight' : 'fadeInLeft';
      document.querySelectorAll('.sidebar .animated').forEach((element, index) => {
        element.style.animationDelay = (100 * index) + 'ms';
        element.classList.remove(animateAction);
        setTimeout(() => {
          // Trigger a DOM reflow
          element.classList.add(animateAction);
        });
      });
    },
    hideSidebar() {
      document.body.classList.remove('sidebar-active');
    }
  };
  sidebarToggleMotion.init();
  NexT.boot.registerEvents();
  NexT.boot.refresh();
  NexT.boot.motion();
  NexT.boot.refreshx();
});

/* pjax.js */
const pjax = new Pjax({
  selectors: [
    'head title',
    'meta[property="og:title"]',
    'script[type="application/json"]',
    // Precede .main-inner to prevent placeholder TOC changes asap
    '.post-toc-wrap',
    '.main-inner',
    '.languages',
    '.pjax'
  ],
  switches: {
    '.post-toc-wrap'(oldWrap, newWrap) {
      if (newWrap.querySelector('.post-toc')) {
        Pjax.switches.outerHTML.call(this, oldWrap, newWrap);
      } else {
        const curTOC = oldWrap.querySelector('.post-toc');
        if (curTOC) {
          curTOC.classList.add('placeholder-toc');
        }
        this.onSwitch();
      }
    }
  },
  analytics: false,
  cacheBust: false,
  scrollTo: !CONFIG.bookmark.enable
});

document.addEventListener('pjax:success', () => {
  pjax.executeScripts(document.querySelectorAll('script[data-pjax]'));
  NexT.boot.refresh();
  NexT.boot.refreshx();
  // Define Motion Sequence & Bootstrap Motion.
  if (CONFIG.motion.enable) {
    NexT.motion.integrator
      .init()
      .add(NexT.motion.middleWares.subMenu)
      // Add sidebar-post-related transition.
      .add(NexT.motion.middleWares.sidebar)
      .add(NexT.motion.middleWares.postList)
      .bootstrap();
  }
  if (CONFIG.sidebar.display !== 'remove') {
    const hasTOC = document.querySelector('.post-toc:not(.placeholder-toc)');
    document.querySelector('.sidebar-inner').classList.toggle('sidebar-nav-active', hasTOC);
    NexT.utils.activateSidebarPanel(hasTOC ? 0 : 1);
    NexT.utils.updateSidebarPosition();
  }
});

/* third-party/giscus.js */
document.addEventListener('page:loaded', () => {
  if (!CONFIG.page.comments) return;

  NexT.utils.loadComments('.giscus-container')
    .then(() => NexT.utils.getScript('https://giscus.app/client.js', {
      attributes: {
        async                   : true,
        crossOrigin             : 'anonymous',
        'data-repo'             : CONFIG.giscus.repo,
        'data-repo-id'          : CONFIG.giscus.repo_id,
        'data-category'         : CONFIG.giscus.category,
        'data-category-id'      : CONFIG.giscus.category_id,
        'data-mapping'          : CONFIG.giscus.mapping,
        'data-strict'           : CONFIG.giscus.strict,
        'data-reactions-enabled': CONFIG.giscus.reactions_enabled,
        'data-emit-metadata'    : CONFIG.giscus.emit_metadata,
        'data-theme'            : CONFIG.giscus.theme || document.body.classList.contains('darkmode') ? 'dark' : 'light',
        'data-lang'             : CONFIG.giscus.lang,
        'data-input-position'   : CONFIG.giscus.input_position,
        'data-loading'          : CONFIG.giscus.loading
      },
      parentNode: document.querySelector('.giscus-container')
    }));
});

/* custom */
window.typing = function typing(el, tl, str_length, index, text_pos, loop=false) {
  let contents = '';
  let row = Math.max(0, index - 0);//index -7
  while (row < index) {
    contents += tl[row++] + '\r\n';
  }
  //document.forms[0].elements[0].value = contents + tl[index].substring(0,text_pos) + "_";
  el.value = contents + tl[index].substring(0, text_pos);
  if (text_pos++ == str_length) {
    text_pos = 0;
    index++;
    if (index != tl.length) {
      str_length = tl[index].length;
      setTimeout(() => {
        typing(el, tl, str_length, index, text_pos, loop);
      }, 1500);
    } else if (loop) setTimeout(() => {
      typing(el, tl, tl[0].length, 0, 0, true);
    }, 1500);
  }
  else
    setTimeout(() => {
      typing(el, tl, str_length, index, text_pos, loop);
    }, 50); // speed
};
document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('.with-love').addEventListener('click', () => {
    const values = 'title: 我是标题\nauthor: Flora\ntags: [生活]\ncategories: [原创, 喵的日记]\ndate: ' + new Date().toLocaleString(
      'en-CA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        hour12: false,
        minute: '2-digit',
        second: '2-digit'
      }
    ).replace(/,/g, '') + '\n---'
    open(`https://github.com/flashlab/flashlab.github.io/new/main/source/_posts?filename=miao.md&value=${encodeURIComponent(values)}`)
  });
  const tar = document.querySelector(".blockquote-center textarea");
  if (tar) {
    const text = tar.textContent.split(/\r?\n/);
    tar.insertAdjacentHTML('afterEnd', '<i class="fa fa-caret-up"></i>')
    typing(tar, text, text[0].length, 0, 0, tar.hasAttribute('loop'))
  }
  /* third-party/topbar.js */
  if(window.topbar) topbar.hide()
})
