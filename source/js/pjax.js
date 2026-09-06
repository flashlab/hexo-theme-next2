/* global CONFIG, NexT, Pjax */

const pjax = new Pjax({
  elements: "a[href]:not(.lang-toggle), form[action]",
  selectors: [
    "head title",
    'meta[property="og:title"]',
    // 只交换恒在的 main/page 配置脚本；评论等按需配置脚本不参与（数量随页面变化会导致 switch fail）
    'script[data-name="main"]',
    'script[data-name="page"]',
    // Precede .main-inner to prevent placeholder TOC changes asap
    ".post-toc-wrap",
    ".main-inner",
    ".lang-toggle",
    ".pjax",
  ],
  switches: {
    ".post-toc-wrap"(oldWrap, newWrap) {
      if (newWrap.querySelector(".post-toc")) {
        Pjax.switches.outerHTML.call(this, oldWrap, newWrap);
      } else {
        const curTOC = oldWrap.querySelector(".post-toc");
        if (curTOC) {
          curTOC.classList.add("placeholder-toc");
        }
        this.onSwitch();
      }
    },
  },
  analytics: false,
  cacheBust: false,
  scrollTo: !CONFIG.bookmark.enable,
});

document.addEventListener("pjax:success", () => {
  pjax.executeScripts(document.querySelectorAll("script[data-pjax]"));
  NexT.boot.refresh();
  // Define Motion Sequence & Bootstrap Motion.
  if (CONFIG.motion.enable) {
    try {
      NexT.motion.integrator
        .init()
        .add(NexT.motion.middleWares.subMenu)
        // Add sidebar-post-related transition.
        .add(NexT.motion.middleWares.sidebar)
        .add(NexT.motion.middleWares.postList)
        .bootstrap();
    } catch (error) {
      console.warn('NexT Motion Error, fallback to static mode', error);
      document.body.classList.remove('use-motion');
      CONFIG.motion.enable = false;
    }
  }
  if (CONFIG.sidebar.display !== "remove") {
    const hasTOC = document.querySelector(".post-toc:not(.placeholder-toc)");
    document
      .querySelector(".sidebar-inner")
      .classList.toggle("sidebar-nav-active", hasTOC);
    NexT.utils.activateSidebarPanel(hasTOC ? 0 : 1);
    NexT.utils.updateSidebarPosition();
    // hide sidebar except on desktop view
    if (window.innerWidth < 992 && !hasTOC)
      document.body.classList.remove("sidebar-active");
  }
});

if (!window.pjax) window.pjax = pjax;
