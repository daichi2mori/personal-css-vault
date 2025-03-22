/**
 * Chrome拡張機能のバックグラウンドスクリプト
 * サイドパネルの表示制御を行います
 */

// サイドパネルを開く処理
chrome.action.onClicked.addListener(async (tab: chrome.tabs.Tab) => {
	console.log("拡張機能アイコンがクリックされました: ", tab.id);

	if (tab.id) {
		try {
			// サイドパネルを開く
			await chrome.sidePanel.open({ tabId: tab.id });
			console.log("サイドパネルを開きました");
		} catch (error) {
			console.error("サイドパネルを開く際にエラーが発生しました: ", error);
		}
	} else {
		console.error("有効なタブIDが見つかりません");
	}
});
