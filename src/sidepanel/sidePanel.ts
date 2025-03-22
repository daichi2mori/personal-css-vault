document.addEventListener("DOMContentLoaded", () => {
	const cssEditor = document.getElementById(
		"css-editor",
	) as HTMLTextAreaElement;
	const currentDomain = document.getElementById(
		"current-domain",
	) as HTMLElement;
	const applyBtn = document.getElementById("apply-btn") as HTMLButtonElement;
	const saveBtn = document.getElementById("save-btn") as HTMLButtonElement;
	const autoApply = document.getElementById("auto-apply") as HTMLInputElement;
	const siteList = document.getElementById("site-list") as HTMLElement;
	const deleteBtn = document.getElementById("delete-btn") as HTMLButtonElement;
	const exportBtn = document.getElementById("export-btn") as HTMLButtonElement;
	const importBtn = document.getElementById("import-btn") as HTMLButtonElement;
	const importFile = document.getElementById("import-file") as HTMLInputElement;
	const tabButtons = Array.from(document.querySelectorAll(".tab-button"));
	const tabContents = Array.from(document.querySelectorAll(".tab-content"));

	let currentSite = "";

	interface SiteData {
		css: string;
		autoApply: boolean;
	}

	interface SitesDataType {
		[key: string]: SiteData;
	}

	let sitesData: SitesDataType = {};

	// タブ切り替え
	for (const button of tabButtons) {
		button.addEventListener("click", () => {
			const tabName = button.getAttribute("data-tab");

			for (const btn of tabButtons) {
				btn.classList.remove("active");
			}
			for (const content of tabContents) {
				content.classList.remove("active");
			}

			button.classList.add("active");
			const tabContent = document.getElementById(`${tabName}-tab`);
			if (tabContent) {
				tabContent.classList.add("active");
			}
		});
	}

	// 現在開いているタブのドメインを取得
	chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		if (tabs[0]?.url) {
			const url = new URL(tabs[0].url);
			currentSite = url.hostname;
			currentDomain.textContent = currentSite;

			// 保存済みのデータを読み込む
			loadSavedData();
		}
	});

	// 保存済みのデータを読み込む
	function loadSavedData(): void {
		chrome.storage.sync.get(
			"sitesData",
			(data: { sitesData?: SitesDataType }) => {
				if (data.sitesData) {
					sitesData = data.sitesData;

					// 現在のサイトのCSSがあれば読み込む
					if (sitesData[currentSite]) {
						cssEditor.value = sitesData[currentSite]?.css ?? "";
						autoApply.checked = sitesData[currentSite]?.autoApply ?? false;
					} else {
						cssEditor.value = "";
						autoApply.checked = false;
					}

					// サイトリストを更新
					updateSiteList();
				}
			},
		);
	}

	// サイトリストを更新
	function updateSiteList(): void {
		siteList.innerHTML = "";

		for (const site in sitesData) {
			const siteItem = document.createElement("div");
			siteItem.className = "site-item";
			if (site === currentSite) {
				siteItem.classList.add("active");
			}
			siteItem.textContent = site;
			siteItem.addEventListener("click", function (this: HTMLElement) {
				for (const item of Array.from(
					document.querySelectorAll(".site-item"),
				)) {
					item.classList.remove("active");
				}
				this.classList.add("active");
			});
			siteList.appendChild(siteItem);
		}
	}

	// CSSを適用するボタン
	applyBtn.addEventListener("click", () => {
		const css = cssEditor.value;

		chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
			if (tabs[0]?.id) {
				chrome.tabs.sendMessage(tabs[0].id, { action: "injectCSS", css: css });
			}
		});
	});

	// CSSを保存するボタン
	saveBtn.addEventListener("click", () => {
		const css = cssEditor.value;

		// サイトのデータを保存
		sitesData[currentSite] = {
			css: css,
			autoApply: autoApply.checked,
		};

		// ストレージに保存
		chrome.storage.sync.set({ sitesData: sitesData }, () => {
			alert("保存しました！");
			updateSiteList();
		});
	});

	// 選択したサイトを削除
	deleteBtn.addEventListener("click", () => {
		const selectedSite = document.querySelector(".site-item.active");
		if (selectedSite?.textContent) {
			const site = selectedSite.textContent;

			if (confirm(`${site} の設定を削除してもよろしいですか？`)) {
				delete sitesData[site];

				chrome.storage.sync.set({ sitesData: sitesData }, () => {
					alert("削除しました！");
					updateSiteList();

					if (site === currentSite) {
						cssEditor.value = "";
						autoApply.checked = false;
					}
				});
			}
		} else {
			alert("削除するサイトを選択してください。");
		}
	});

	// 設定をエクスポート
	exportBtn.addEventListener("click", () => {
		const dataStr = JSON.stringify(sitesData);
		const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;

		const exportFileDefaultName = "css-override-settings.json";

		const linkElement = document.createElement("a");
		linkElement.setAttribute("href", dataUri);
		linkElement.setAttribute("download", exportFileDefaultName);
		linkElement.click();
	});

	// インポートボタンをクリックしたらファイル選択ダイアログを開く
	importBtn.addEventListener("click", () => {
		importFile.click();
	});

	// 設定をインポート
	importFile.addEventListener("change", (event: Event) => {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];

		if (file) {
			const reader = new FileReader();

			reader.onload = (e: ProgressEvent<FileReader>) => {
				try {
					if (e.target?.result) {
						const importedData = JSON.parse(
							e.target.result as string,
						) as SitesDataType;

						if (
							confirm(
								"インポートすると現在の設定が上書きされます。続行しますか？",
							)
						) {
							sitesData = importedData;

							chrome.storage.sync.set({ sitesData: sitesData }, () => {
								alert("インポートしました！");
								loadSavedData();
							});
						}
					}
				} catch (error) {
					alert("インポートに失敗しました。ファイル形式が正しくありません。");
					console.error(error);
				}
			};

			reader.readAsText(file);
		}
	});
});
