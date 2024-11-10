async function init() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentUrl = tab.url;

    console.log('Current URL:', currentUrl);

    // 登録済みドメインかチェック
    const { targetDomains = [] } = await chrome.storage.sync.get('targetDomains');
    const isTargetUrl = targetDomains.some(domain => currentUrl.includes(domain));

    console.log('Target domains:', targetDomains);
    console.log('Is target URL:', isTargetUrl);

    // 初期値をnullに変更（未チェック状態を表現）
    let isIndexed = null;
    if (isTargetUrl) {
        // キャッシュからインデックス状況を取得
        const cache = await chrome.storage.local.get(currentUrl);
        console.log('Cache data:', cache);

        if (cache[currentUrl]) {
            isIndexed = cache[currentUrl].isIndexed;
            console.log('Is indexed (from cache):', isIndexed);
        } else {
            // キャッシュがない場合は新しくチェック
            console.log('No cache data found, checking index status...');
            const response = await chrome.runtime.sendMessage({
                type: 'checkIndexStatus',
                url: currentUrl
            });
            isIndexed = response.isIndexed;
            console.log('Fresh index check result:', isIndexed);
        }
    }

    console.log('Final status:', {
        isTargetUrl,
        isIndexed,
        currentUrl
    });

    updateUI(isTargetUrl, isIndexed, currentUrl);
}

function updateUI(isTargetUrl, isIndexed, currentUrl) {
    console.log('Updating UI with:', {
        isTargetUrl,
        isIndexed,
        currentUrl
    });

    // ローディング非表示
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('content').classList.remove('hidden');

    if (isTargetUrl) {
        // 対象URLの場合
        console.log('Showing target URL content');
        document.getElementById('target-content').classList.remove('hidden');

        const statusElement = document.getElementById('status');
        const statusTextElement = document.getElementById('status-text');
        const gscButton = document.getElementById('gsc-button');

        if (isIndexed === true) { // 厳密な比較に変更
            console.log('Showing indexed status');
            statusElement.classList.add('indexed');
            statusElement.classList.remove('not-indexed');
            statusTextElement.textContent = 'このページはGoogleにインデックスされています。';
            gscButton.classList.add('hidden');
        } else if (isIndexed === false) { // falseの場合
            console.log('Showing not-indexed status');
            statusElement.classList.remove('indexed');
            statusElement.classList.add('not-indexed');
            statusTextElement.textContent = 'このページはまだGoogleにインデックスされていません。';
            gscButton.classList.remove('hidden');
        } else { // nullの場合
            console.log('Showing checking status');
            statusTextElement.textContent = 'インデックス状況を確認中...';
            gscButton.classList.add('hidden');
        }

        // GSCボタンのイベントリスナー設定
        gscButton.onclick = () => {
            const inspectUrl = encodeURIComponent(currentUrl);
            const gscUrl = `https://search.google.com/search-console/inspect?resource_id=sc-domain:${new URL(currentUrl).hostname}&url=${inspectUrl}`;
            chrome.tabs.create({ url: gscUrl });
        };
    } else {
        // 対象外URLの場合
        console.log('Showing non-target URL content');
        document.getElementById('non-target-content').classList.remove('hidden');
    }
}

// 初期化
document.addEventListener('DOMContentLoaded', init);
