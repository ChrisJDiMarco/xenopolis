/* TEMP build-check harness: nothing it does is saved. Removed before shipping. */
(function () {
  const C = window.cabinet, stub = () => {}; if (!C) return;
  try { C.remember = stub; if (C.store) C.store.put = () => Promise.resolve(); Storage.prototype.setItem = stub; } catch (e) {}
  if (C.remember !== stub) { console.error('TEST: could not stub saves, skipping'); return; }
  const boot = App.boot;
  App.boot = function (cv) {
    boot(cv); document.getElementById('menuB').click();
    setTimeout(() => { const p = document.getElementById('panel'); p.scrollTop = p.scrollHeight; console.error('TEST panel', document.getElementById('worlds').textContent.slice(0, 80), '|', document.getElementById('figBox').textContent.slice(0, 160)); }, 3500);
  };
})();
