document.addEventListener('DOMContentLoaded', function() {
  const cssEditor = document.getElementById('css-editor');
  const currentDomain = document.getElementById('current-domain');
  const applyBtn = document.getElementById('apply-btn');
  const saveBtn = document.getElementById('save-btn');
  const autoApply = document.getElementById('auto-apply');
  const siteList = document.getElementById('site-list');
  const deleteBtn = document.getElementById('delete-btn');
  const exportBtn = document.getElementById('export-btn');
  const importBtn = document.getElementById('import-btn');
  const importFile = document.getElementById('import-file');
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');

  let currentSite = '';
  let sitesData = {};

  // タブ切り替え
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.getAttribute('data-tab');

      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));

      button.classList.add('active');
      document.getElementById(`${tabName}-tab`).classList.add('active');
    });
  });

  // 現在開いているタブのドメインを取得
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (tabs[0]) {
      const url = new URL(tabs[0].url);
      currentSite = url.hostname;
      currentDomain.textContent = currentSite;

      // 保存済みのデータを読み込む
      loadSavedData();
    }
  });

  // 保存済みのデータを読み込む
  function loadSavedData() {
    chrome.storage.sync.get('sitesData', function(data) {
      if (data.sitesData) {
        sitesData = data.sitesData;

        // 現在のサイトのCSSがあれば読み込む
        if (sitesData[currentSite]) {
          cssEditor.value = sitesData[currentSite].css;
          autoApply.checked = sitesData[currentSite].autoApply;
        } else {
          cssEditor.value = '';
          autoApply.checked = false;
        }

        // サイトリストを更新
        updateSiteList();
      }
    });
  }

  // サイトリストを更新
  function updateSiteList() {
    siteList.innerHTML = '';

    for (const site in sitesData) {
      const siteItem = document.createElement('div');
      siteItem.className = 'site-item';
      if (site === currentSite) {
        siteItem.classList.add('active');
      }
      siteItem.textContent = site;
      siteItem.addEventListener('click', function() {
        document.querySelectorAll('.site-item').forEach(item => {
          item.classList.remove('active');
        });
        this.classList.add('active');
      });
      siteList.appendChild(siteItem);
    }
  }

  // CSSを適用するボタン
  applyBtn.addEventListener('click', function() {
    const css = cssEditor.value;

    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      // chrome.scripting.executeScript({
      //   target: { tabId: tabs[0].id },
      //   function: injectCSS,
      //   args: [css]
      // });
      chrome.tabs.sendMessage(tabs[0].id, { action: 'injectCSS', css: css });
    });
  });

  // CSSを保存するボタン
  saveBtn.addEventListener('click', function() {
    const css = cssEditor.value;

    // サイトのデータを保存
    sitesData[currentSite] = {
      css: css,
      autoApply: autoApply.checked
    };

    // ストレージに保存
    chrome.storage.sync.set({ sitesData: sitesData }, function() {
      alert('保存しました！');
      updateSiteList();
    });
  });

  // 選択したサイトを削除
  deleteBtn.addEventListener('click', function() {
    const selectedSite = document.querySelector('.site-item.active');
    if (selectedSite) {
      const site = selectedSite.textContent;

      if (confirm(`${site} の設定を削除してもよろしいですか？`)) {
        delete sitesData[site];

        chrome.storage.sync.set({ sitesData: sitesData }, function() {
          alert('削除しました！');
          updateSiteList();

          if (site === currentSite) {
            cssEditor.value = '';
            autoApply.checked = false;
          }
        });
      }
    } else {
      alert('削除するサイトを選択してください。');
    }
  });

  // 設定をエクスポート
  exportBtn.addEventListener('click', function() {
    const dataStr = JSON.stringify(sitesData);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = 'css-override-settings.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  });

  // インポートボタンをクリックしたらファイル選択ダイアログを開く
  importBtn.addEventListener('click', function() {
    importFile.click();
  });

  // 設定をインポート
  importFile.addEventListener('change', function(event) {
    const file = event.target.files[0];

    if (file) {
      const reader = new FileReader();

      reader.onload = function(e) {
        try {
          const importedData = JSON.parse(e.target.result);

          if (confirm('インポートすると現在の設定が上書きされます。続行しますか？')) {
            sitesData = importedData;

            chrome.storage.sync.set({ sitesData: sitesData }, function() {
              alert('インポートしました！');
              loadSavedData();
            });
          }
        } catch (error) {
          alert('インポートに失敗しました。ファイル形式が正しくありません。');
          console.error(error);
        }
      };

      reader.readAsText(file);
    }
  });
});
