export default function registerSW() {
  if ('serviceWorker' in navigator) {
    const isStandalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = typeof window.navigator.standalone === 'boolean' && window.navigator.standalone;

    // In modalità standalone (PWA), evita problemi di cache su iOS disabilitando SW
    if (isStandalone || isIOSStandalone) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => r.unregister());
      }).catch(() => {});
      return;
    }

    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
  }
} 