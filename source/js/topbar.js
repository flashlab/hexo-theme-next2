/**
 * @license MIT
 * topbar 2.0.2
 * http://buunguyen.github.io/topbar
 * Copyright (c) 2024 Buu Nguyen
 */
(function (window, document) {
    "use strict";
  
    var canvas,
      currentProgress,
      showing,
      progressTimerId = null,
      fadeTimerId = null,
      delayTimerId = null,
      addEvent = function (elem, type, handler) {
        if (elem.addEventListener) elem.addEventListener(type, handler, false);
        else if (elem.attachEvent) elem.attachEvent("on" + type, handler);
        else elem["on" + type] = handler;
      },
      options = {
        autoRun: true,
        barThickness: 2,
        barColors: {
          '0'        : 'rgba(255,  255, 255, .9)',
          '1.0'      : 'rgba(0, 0,  0,  .9)'
        },
        shadowBlur: 0,
        shadowColor: "rgba(0,   0,   0,   .6)",
        className: null,
      },
      repaint = function () {
        canvas.width = window.innerWidth;
        canvas.height = options.barThickness * 5; // need space for shadow
  
        var ctx = canvas.getContext("2d");
        ctx.shadowBlur = options.shadowBlur;
        ctx.shadowColor = options.shadowColor;
  
        var lineGradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        for (var stop in options.barColors)
          lineGradient.addColorStop(stop, options.barColors[stop]);
        ctx.lineWidth = options.barThickness;
        ctx.beginPath();
        ctx.moveTo(0, options.barThickness / 2);
        ctx.lineTo(
          Math.ceil(currentProgress * canvas.width),
          options.barThickness / 2
        );
        ctx.strokeStyle = lineGradient;
        ctx.stroke();
      },
      createCanvas = function () {
        canvas = document.createElement("canvas");
        var style = canvas.style;
        style.position = "fixed";
        style.top = style.left = style.right = style.margin = style.padding = 0;
        style.zIndex = 100001;
        style.display = "none";
        if (options.className) canvas.classList.add(options.className);
        document.body.appendChild(canvas);
        addEvent(window, "resize", repaint);
      },
      topbar = {
        config: function (opts) {
          for (var key in opts)
            if (options.hasOwnProperty(key)) options[key] = opts[key];
        },
        show: function (delay) {
          if (showing) return;
          if (!document.body) {
            let observer = new MutationObserver(() => {
              if (document.body) {
                topbar.show(delay);
                observer.disconnect();
              }
            });
            return observer.observe(document.documentElement, {childList: true});
          }
          if (delay) {
            if (delayTimerId) return;
            delayTimerId = setTimeout(() => topbar.show(), delay);
          } else  {
            showing = true;
            if (fadeTimerId !== null) window.cancelAnimationFrame(fadeTimerId);
            if (!canvas) createCanvas();
            canvas.style.opacity = 1;
            canvas.style.display = "block";
            topbar.progress(0);
            if (options.autoRun) {
              (function loop() {
                progressTimerId = window.requestAnimationFrame(loop);
                topbar.progress(
                  "+" + 0.05 * Math.pow(1 - Math.sqrt(currentProgress), 2)
                );
              })();
            }
          }
        },
        progress: function (to) {
          if (typeof to === "undefined") return currentProgress;
          if (typeof to === "string") {
            to =
              (to.indexOf("+") >= 0 || to.indexOf("-") >= 0
                ? currentProgress
                : 0) + parseFloat(to);
          }
          currentProgress = to > 1 ? 1 : to;
          repaint();
          return currentProgress;
        },
        hide: function () {
          clearTimeout(delayTimerId);
          delayTimerId = null;
          if (!showing) return;
          showing = false;
          if (progressTimerId != null) {
            window.cancelAnimationFrame(progressTimerId);
            progressTimerId = null;
          }
          (function loop() {
            if (topbar.progress("+.1") >= 1) {
              canvas.style.opacity -= 0.05;
              if (canvas.style.opacity <= 0.05) {
                canvas.style.display = "none";
                fadeTimerId = null;
                return;
              }
            }
            fadeTimerId = window.requestAnimationFrame(loop);
          })();
        },
      };
  
    if (typeof module === "object" && typeof module.exports === "object") {
      module.exports = topbar;
    } else if (typeof define === "function" && define.amd) {
      define(function () {
        return topbar;
      });
    } else {
      this.topbar = topbar;
    }
  }.call(this, window, document));

/* third-party/topbar.js */

document.addEventListener('pjax:send', () => {topbar.show()});
document.addEventListener('pjax:complete', () => {topbar.hide()});
if (document.readyState === 'loading') topbar.show()