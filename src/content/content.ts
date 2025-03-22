// ページ読み込み時にCSSを適用する
(() => {
	const currentDomain: string = window.location.hostname;

	chrome.storage.sync.get(
		"sitesData",
		(data: {
			sitesData?: Record<string, { autoApply: boolean; css: string }>;
		}) => {
			if (data.sitesData?.[currentDomain]?.autoApply) {
				injectCSS(data.sitesData[currentDomain].css);
			}
		},
	);

	// メッセージリスナー
	chrome.runtime.onMessage.addListener(
		(
			request: { action: string; css?: string },
			sender: chrome.runtime.MessageSender,
			sendResponse: (response?: { success: boolean }) => void,
		) => {
			if (request.action === "injectCSS" && request.css) {
				injectCSS(request.css);
				sendResponse({ success: true });
			}
		},
	);
})();

// CSS注入関数（content.tsとpopup.tsで共有）
function injectCSS(css: string): void {
	// 既存のスタイル要素を検索
	let styleElement: HTMLStyleElement | null = document.getElementById(
		"css-override-style",
	) as HTMLStyleElement;

	// なければ新しく作成
	if (!styleElement) {
		styleElement = document.createElement("style");
		styleElement.id = "css-override-style";
		document.head.appendChild(styleElement);
	}

	// CSSを設定
	styleElement.textContent = css;
}
