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
  elements: "a[href]:not(.lang-toggle), form[action]",
  selectors: [
    'head title',
    'meta[property="og:title"]',
    'script[type="application/json"]',
    // Precede .main-inner to prevent placeholder TOC changes asap
    '.post-toc-wrap',
    '.main-inner',
    '.lang-toggle',
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
  if (!CONFIG.page.comments || !CONFIG.twikoo) return;
  CONFIG.twikoo.path = CONFIG.page.path
  CONFIG.twikoo.lang = CONFIG.page.lang

  // NexT.utils.loadComments('.giscus-container')
  //   .then(() => NexT.utils.getScript('https://giscus.app/client.js', {
  //     attributes: {
  //       async                   : true,
  //       crossOrigin             : 'anonymous',
  //       'data-repo'             : CONFIG.giscus.repo,
  //       'data-repo-id'          : CONFIG.giscus.repo_id,
  //       'data-category'         : CONFIG.giscus.category,
  //       'data-category-id'      : CONFIG.giscus.category_id,
  //       'data-mapping'          : CONFIG.giscus.mapping,
  //       'data-strict'           : CONFIG.giscus.strict,
  //       'data-reactions-enabled': CONFIG.giscus.reactions_enabled,
  //       'data-emit-metadata'    : CONFIG.giscus.emit_metadata,
  //       'data-theme'            : CONFIG.giscus.theme || document.body.classList.contains('darkmode') ? 'dark' : 'light',
  //       'data-lang'             : CONFIG.giscus.lang || CONFIG.page.lang,
  //       'data-input-position'   : CONFIG.giscus.input_position,
  //       'data-loading'          : CONFIG.giscus.loading
  //     },
  //     parentNode: document.querySelector('.giscus-container')
  //   }));

  NexT.utils.loadComments(CONFIG.twikoo.el)
    .then(() => NexT.utils.getScript(CONFIG.twikoo.jsUrl || 'https://cdn.jsdelivr.net/npm/twikoo/dist/twikoo.all.min.js', { condition: window.twikoo }))
    .then(() => {twikoo.init(CONFIG.twikoo)});
});

/* third-party/local-search.js */
class LocalSearch {
  constructor({
    path = '',
    unescape = false,
    top_n_per_article = 1
  }) {
    this.path = path;
    this.unescape = unescape;
    this.top_n_per_article = top_n_per_article;
    this.isfetched = false;
    this.datas = null;
  }

  getIndexByWord(words, text, caseSensitive = false) {
    const index = [];
    const included = new Set();

    if (!caseSensitive) {
      text = text.toLowerCase();
    }
    words.forEach(word => {
      if (this.unescape) {
        const div = document.createElement('div');
        div.innerText = word;
        word = div.innerHTML;
      }
      const wordLen = word.length;
      if (wordLen === 0) return;
      let startPosition = 0;
      let position = -1;
      if (!caseSensitive) {
        word = word.toLowerCase();
      }
      while ((position = text.indexOf(word, startPosition)) > -1) {
        index.push({ position, word });
        included.add(word);
        startPosition = position + wordLen;
      }
    });
    // Sort index by position of keyword
    index.sort((left, right) => {
      if (left.position !== right.position) {
        return left.position - right.position;
      }
      return right.word.length - left.word.length;
    });
    return [index, included];
  }

  // Merge hits into slices
  mergeIntoSlice(start, end, index) {
    let item = index[0];
    let { position, word } = item;
    const hits = [];
    const count = new Set();
    while (position + word.length <= end && index.length !== 0) {
      count.add(word);
      hits.push({
        position,
        length: word.length
      });
      const wordEnd = position + word.length;

      // Move to next position of hit
      index.shift();
      while (index.length !== 0) {
        item = index[0];
        position = item.position;
        word = item.word;
        if (wordEnd > position) {
          index.shift();
        } else {
          break;
        }
      }
    }
    return {
      hits,
      start,
      end,
      count: count.size
    };
  }

  // Highlight title and content
  highlightKeyword(val, slice) {
    let result = '';
    let index = slice.start;
    for (const { position, length } of slice.hits) {
      result += val.substring(index, position);
      index = position + length;
      result += `<mark class="search-keyword">${val.substr(position, length)}</mark>`;
    }
    result += val.substring(index, slice.end);
    return result;
  }

  getResultItems(keywords) {
    const resultItems = [];
    this.datas.forEach(({ title, content, url }) => {
      // The number of different keywords included in the article.
      const [indexOfTitle, keysOfTitle] = this.getIndexByWord(keywords, title);
      const [indexOfContent, keysOfContent] = this.getIndexByWord(keywords, content);
      const includedCount = new Set([...keysOfTitle, ...keysOfContent]).size;

      // Show search results
      const hitCount = indexOfTitle.length + indexOfContent.length;
      if (hitCount === 0) return;

      const slicesOfTitle = [];
      if (indexOfTitle.length !== 0) {
        slicesOfTitle.push(this.mergeIntoSlice(0, title.length, indexOfTitle));
      }

      let slicesOfContent = [];
      while (indexOfContent.length !== 0) {
        const item = indexOfContent[0];
        const { position } = item;
        // Cut out 100 characters. The maxlength of .search-input is 80.
        const start = Math.max(0, position - 20);
        const end = Math.min(content.length, position + 80);
        slicesOfContent.push(this.mergeIntoSlice(start, end, indexOfContent));
      }

      // Sort slices in content by included keywords' count and hits' count
      slicesOfContent.sort((left, right) => {
        if (left.count !== right.count) {
          return right.count - left.count;
        } else if (left.hits.length !== right.hits.length) {
          return right.hits.length - left.hits.length;
        }
        return left.start - right.start;
      });

      // Select top N slices in content
      const upperBound = parseInt(this.top_n_per_article, 10);
      if (upperBound >= 0) {
        slicesOfContent = slicesOfContent.slice(0, upperBound);
      }

      let resultItem = '';

      url = new URL(url, location.origin);
      url.searchParams.append('highlight', keywords.join(' '));

      if (slicesOfTitle.length !== 0) {
        resultItem += `<li><a href="${url.href}" class="search-result-title">${this.highlightKeyword(title, slicesOfTitle[0])}</a>`;
      } else {
        resultItem += `<li><a href="${url.href}" class="search-result-title">${title}</a>`;
      }

      slicesOfContent.forEach(slice => {
        resultItem += `<a href="${url.href}"><p class="search-result">${this.highlightKeyword(content, slice)}...</p></a>`;
      });

      resultItem += '</li>';
      resultItems.push({
        item: resultItem,
        id  : resultItems.length,
        hitCount,
        includedCount
      });
    });
    return resultItems;
  }

  fetchData() {
    const isXml = !this.path.endsWith('json');
    fetch(this.path)
      .then(response => response.text())
      .then(res => {
        // Get the contents from search data
        this.isfetched = true;
        this.datas = isXml ? [...new DOMParser().parseFromString(res, 'text/xml').querySelectorAll('entry')].map(element => ({
          title  : element.querySelector('title').textContent,
          content: element.querySelector('content').textContent,
          url    : element.querySelector('url').textContent
        })) : JSON.parse(res);
        // Only match articles with non-empty titles
        this.datas = this.datas.filter(data => data.title).map(data => {
          data.title = data.title.trim();
          data.content = data.content ? data.content.trim().replace(/<[^>]+>/g, '') : '';
          data.url = decodeURIComponent(data.url).replace(/\/{2,}/g, '/');
          return data;
        });
        // Remove loading animation
        window.dispatchEvent(new Event('search:loaded'));
      });
  }

  // Highlight by wrapping node in mark elements with the given class name
  highlightText(node, slice, className) {
    const val = node.nodeValue;
    let index = slice.start;
    const children = [];
    for (const { position, length } of slice.hits) {
      const text = document.createTextNode(val.substring(index, position));
      index = position + length;
      const mark = document.createElement('mark');
      mark.className = className;
      mark.appendChild(document.createTextNode(val.substr(position, length)));
      children.push(text, mark);
    }
    node.nodeValue = val.substring(index, slice.end);
    children.forEach(element => {
      node.parentNode.insertBefore(element, node);
    });
  }

  // Highlight the search words provided in the url in the text
  highlightSearchWords(body) {
    const params = new URL(location.href).searchParams.get('highlight');
    const keywords = params ? params.split(' ') : [];
    if (!keywords.length || !body) return;
    const walk = document.createTreeWalker(body, NodeFilter.SHOW_TEXT, null);
    const allNodes = [];
    while (walk.nextNode()) {
      if (!walk.currentNode.parentNode.matches('button, select, textarea, .mermaid')) allNodes.push(walk.currentNode);
    }
    allNodes.forEach(node => {
      const [indexOfNode] = this.getIndexByWord(keywords, node.nodeValue);
      if (!indexOfNode.length) return;
      const slice = this.mergeIntoSlice(0, node.nodeValue.length, indexOfNode);
      this.highlightText(node, slice, 'search-keyword');
    });
  }
}
document.addEventListener('DOMContentLoaded', () => {
  if (!CONFIG.path) {
    // Search DB path
    console.warn('`hexo-generator-searchdb` plugin is not installed!');
    return;
  }
  const localSearch = new LocalSearch({
    path             : CONFIG.path,
    top_n_per_article: CONFIG.localsearch.top_n_per_article,
    unescape         : CONFIG.localsearch.unescape
  });

  const input = document.querySelector('.search-input');
  const container = document.querySelector('.search-result-container');

  const inputEventFunction = () => {
    if (!localSearch.isfetched) return;
    const searchText = input.value.trim().toLowerCase();
    const keywords = searchText.split(/[-\s]+/);
    let resultItems = [];
    if (searchText.length > 0) {
      // Perform local searching
      resultItems = localSearch.getResultItems(keywords);
    }
    if (keywords.length === 1 && keywords[0] === '') {
      container.innerHTML = '<div class="search-result-icon"><i class="fa fa-search fa-5x"></i></div>';
    } else if (resultItems.length === 0) {
      container.innerHTML = '<div class="search-result-icon"><i class="far fa-frown fa-5x"></i></div>';
    } else {
      resultItems.sort((left, right) => {
        if (left.includedCount !== right.includedCount) {
          return right.includedCount - left.includedCount;
        } else if (left.hitCount !== right.hitCount) {
          return right.hitCount - left.hitCount;
        }
        return right.id - left.id;
      });
      const stats = CONFIG.i18n.hits.replace('${hits}', resultItems.length);

      container.innerHTML = `<div class="search-stats">${stats}</div>
        <hr>
        <ul class="search-result-list">${resultItems.map(result => result.item).join('')}</ul>`;
      if (typeof pjax === 'object') pjax.refresh(container);
    }
  };

  localSearch.highlightSearchWords(document.querySelector('.post-body'));
  if (CONFIG.localsearch.preload) {
    localSearch.fetchData();
  }

  input.addEventListener('input', inputEventFunction);
  window.addEventListener('search:loaded', inputEventFunction);

  // Handle and trigger popup window
  document.querySelectorAll('.popup-trigger').forEach(element => {
    element.addEventListener('click', () => {
      document.body.classList.add('search-active');
      // Wait for search-popup animation to complete
      setTimeout(() => input.focus(), 500);
      if (!localSearch.isfetched) localSearch.fetchData();
    });
  });

  // Monitor main search box
  const onPopupClose = () => {
    document.body.classList.remove('search-active');
  };

  document.querySelector('.search-pop-overlay').addEventListener('click', event => {
    if (event.target === document.querySelector('.search-pop-overlay')) {
      onPopupClose();
    }
  });
  document.querySelector('.popup-btn-close').addEventListener('click', onPopupClose);
  document.addEventListener('pjax:success', () => {
    localSearch.highlightSearchWords(document.querySelector('.post-body'));
    onPopupClose();
  });
  window.addEventListener('keyup', event => {
    if (event.key === 'Escape') {
      onPopupClose();
    }
  });
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
      el.datset.tid = setTimeout(() => {
        typing(el, tl, str_length, index, text_pos, loop);
      }, 1500);
    } else if (loop) el.datset.tid = setTimeout(() => {
      typing(el, tl, tl[0].length, 0, 0, true);
    }, 1500);
  }
  else
  el.datset.tid = setTimeout(() => {
      typing(el, tl, str_length, index, text_pos, loop);
    }, 50); // speed
};
document.addEventListener('DOMContentLoaded', () => {
  // footer pen icon
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

  /* third-party/topbar.js */
  if(window.topbar) topbar.hide()
});

document.addEventListener('page:loaded', () => {
  // typings
  document.querySelectorAll(".blockquote-center textarea").forEach(typ => {
    clearTimeout(typ.dataset.tid)
    const text = typ.textContent.split(/\r?\n/)
    typ.insertAdjacentHTML('afterEnd', '<i class="fa fa-caret-up"></i>')
    typing(typ, text, text[0].length, 0, 0, typ.hasAttribute('loop'))
  });
  // Disqus button
  const disq = document.querySelector('a[title="Disqus"]')
  if (disq) disq.addEventListener('click', (e) => {
    e.target.style="pointer-events: none;"
    setTimeout(() => {
      e.target.style="pointer-events: auto;"
    }, "10000");
    if (!window.disqus_config) window.disqus_config = function() {
      this.page.url = CONFIG.page.permalink;
      this.page.identifier = CONFIG.page.path;
      this.page.title = CONFIG.page.title;
    };
    if (window.DISQUS) {
      DISQUS.reset({
        reload: true,
        config: window.disqus_config
      });
    } else {
      NexT.utils.getScript(`https://flashlab.disqus.com/embed.js`, {
        attributes: { dataset: { timestamp: '' + +new Date() } }
      });
    }
  })
  // flash
  if (!window.Flash) window.Flash = {
    loadSwf(ele, player) {
      const swfUrl = ele.dataset.url.includes('http') ? ele.dataset.url : 'https://pic.313159.xyz/' + ele.dataset.url
      const swfTitle = ele.dataset.tit
      const swfplayer = player ?? ele.querySelector('ruffle-player')
      let res = swfTitle
      if (swfplayer) swfplayer.load(swfUrl).then(() => {
      }).catch((e) => {res = "加载失败：" + e})
      ele.querySelectorAll('.ctl-title').forEach(el => {el.textContent = res})
    },
    fullScr(ele) {
      const swfplayer = ele.querySelector('ruffle-player')
      if (swfplayer) swfplayer.enterFullscreen()
    },
    async loadSwfPlayer() {
      const swfs = document.querySelectorAll('.swfWrapper')
      const swfe = document.querySelectorAll('embed[src$=".swf"]')
      if (swfs.length == 0 && swfe.length == 0) return
      const metaJ = await NexT.utils.getFetch('https://api.cdnjs.com/libraries/ruffle-rs?fields=latest,version&search_fields=name')
      NexT.utils.getScript(metaJ.latest ?? 'https://cdnjs.cloudflare.com/ajax/libs/ruffle-rs/0.1.0-nightly.2024.7.19/ruffle.js', {
        condition: window.RufflePlayer
      }).then(() => {
        const ruffleVer = window.RufflePlayer.sources.local.version
        document.querySelectorAll('.ruffleVer').forEach(el => {el.textContent = ' v' + ruffleVer})
        if (swfs.length > 0) {
          const ruffle = window.RufflePlayer.newest()
          swfs.forEach(ele => {
            const swfContainer = ele.querySelector('.swfContainer')
            swfContainer.classList.remove('cover-layer')
            swfContainer.querySelectorAll('ruffle-player').forEach(el => {swfContainer.removeChild(el)})
            //swfContainer.appendChild(ruffle.createPlayer())
            this.loadSwf(ele, swfContainer.appendChild(ruffle.createPlayer()))
          })
        }
      })
    }
  }
  Flash.loadSwfPlayer()
})
