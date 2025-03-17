// ページ読み込み時にCSSを適用する
(function() {
  const currentDomain = window.location.hostname;

  chrome.storage.sync.get('sitesData', function(data) {
    if (data.sitesData && data.sitesData[currentDomain] && data.sitesData[currentDomain].autoApply) {
      injectCSS(data.sitesData[currentDomain].css);
    }
  });

  // メッセージリスナー
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'injectCSS') {
      injectCSS(request.css);
      sendResponse({ success: true });
    }
  });
})();

// CSS注入関数（content.jsとpopup.jsで共有）
function injectCSS(css) {
  // 既存のスタイル要素を検索
  let styleElement = document.getElementById('css-override-style');

  // なければ新しく作成
  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.id = 'css-override-style';
    document.head.appendChild(styleElement);
  }

  // CSSを設定
  styleElement.textContent = css;
}
