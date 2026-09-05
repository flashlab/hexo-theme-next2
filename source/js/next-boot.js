/* global NexT, CONFIG */

NexT.boot = {};

NexT.boot.registerEvents = function () {
  NexT.utils.registerScrollPercent();
  NexT.utils.registerThemeToggle();

  // Mobile top menu bar.
  document
    .querySelector(".site-nav-toggle .toggle")
    .addEventListener("click", (event) => {
      event.currentTarget.classList.toggle("toggle-close");
      const siteNav = document.querySelector(".site-nav");
      if (!siteNav) return;
      siteNav.style.setProperty("--scroll-height", siteNav.scrollHeight + "px");
      document.body.classList.toggle("site-nav-on");
    });

  document.querySelectorAll(".sidebar-nav li").forEach((element, index) => {
    element.addEventListener("click", () => {
      NexT.utils.activateSidebarPanel(index);
    });
  });

  window.addEventListener("hashchange", () => {
    const tHash = location.hash;
    if (tHash !== "" && !tHash.match(/%\S{2}/)) {
      const target = document.querySelector(
        `.tabs ul.nav-tabs li a[href="${tHash}"]`,
      );
      target && target.click();
    }
  });

  window.addEventListener("tabs:click", (e) => {
    NexT.utils.registerCodeblock(e.target);
  });
};

NexT.boot.refresh = function () {
  /**
   * Register JS handlers by condition option.
   * Need to add config option in Front-End at 'scripts/helpers/next-config.js' file.
   */

  CONFIG.exturl && NexT.utils.registerExtURL();
  NexT.utils.registerCodeblock();
  NexT.utils.registerActiveMenuItem();
  NexT.utils.registerSidebarTOC();
  NexT.utils.registerPostReward();
  NexT.utils.registerVideoIframe();
};

NexT.boot.refreshx = function () {
  CONFIG.prism && window.Prism.highlightAll();
  CONFIG.mediumzoom &&
    window
      .mediumZoom('.post-body :not(a) > img:not([alt$=":"])', {
        background: "var(--content-bg-color)",
      })
      .on("open", (event) => {
        event.target.style.height = "auto";
      })
      .on("opened", (event) => {
        event.target.style.height = null;
      });
  CONFIG.lazyload && window.lozad("[data-src]").observe();
  CONFIG.pangu && window.pangu.spacingPage();
};

NexT.boot.motion = function () {
  // Define Motion Sequence & Bootstrap Motion.
  if (CONFIG.motion.enable) {
    NexT.motion.integrator
      .add(NexT.motion.middleWares.header)
      .add(NexT.motion.middleWares.sidebar)
      .add(NexT.motion.middleWares.postList)
      .add(NexT.motion.middleWares.footer)
      .bootstrap();
  }
  NexT.utils.updateSidebarPosition();
};
