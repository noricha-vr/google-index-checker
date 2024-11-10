// インデックス状況のキャッシュ管理
class IndexStatusCache {
    static CACHE_DURATION = 24 * 60 * 60 * 1000; // 24時間
    static DEBUG = true; // デバッグモード

    static async get(url) {
        if (this.DEBUG) {
            console.log('Debug mode: Cache disabled');
            return null;
        }

        const data = await chrome.storage.local.get(url);
        if (!data[url]) return null;

        const cache = data[url];
        if (Date.now() - new Date(cache.lastChecked).getTime() > this.CACHE_DURATION) {
            return null;
        }
        return cache;
    }

    static async set(url, isIndexed) {
        if (this.DEBUG) {
            console.log('Debug mode: Skipping cache save');
            return;
        }

        await chrome.storage.local.set({
            [url]: {
                lastChecked: new Date().toISOString(),
                isIndexed
            }
        });
    }
}
// インデックス状況の確認
async function checkIndexStatus(url) {
    try {
        console.log(`Checking index status for URL: ${url}`);

        const encodedUrl = encodeURIComponent(`site:${url}`);
        // TODO おそらく期限付きのトークンがこのURLにある。そのため時間が経つとエラーになる可能性がある。
        const requestUrl = `https://www.google.com/search?q=${encodedUrl}&oq=${encodedUrl}&gs_lcrp=EgZjaHJvbWUqBggAEEUYOzIGCAAQRRg7MgYIARBFGDrSAQgyMjM0ajBqN6gCCLACAQ&sourceid=chrome&ie=UTF-8`;
        console.log(`Request URL: ${requestUrl}`);

        const response = await fetch(requestUrl);
        const buffer = await response.arrayBuffer();
        const decoder = new TextDecoder('utf-8');
        const html = decoder.decode(buffer);
        console.log('Response HTML:', html);

        // インデックスされていない場合のシグナル
        const notIndexedSignals = [
            'に一致する情報は見つかりませんでした',
            'に一致する検索結果はありません',
            'Your search did not match any documents',
            'did not match any search results',
            '検索条件に一致するページは見つかりませんでした'
        ];

        // インデックスされている場合のシグナル
        const indexedSignals = [
            'class="LC20lb"',     // 検索結果のタイトルクラス
            'class="VwiC3b"',     // 検索結果の説明文ク���
            'class="yuRUbf"',     // 検索結果のコンテナクラス
            'data-hveid'          // 検索結果の属性
        ];

        // インデックス状態の判定
        const hasNoIndexSignals = notIndexedSignals.some(signal => html.includes(signal));
        const hasIndexSignals = indexedSignals.some(signal => html.includes(signal));
        const isIndexed = !hasNoIndexSignals && hasIndexSignals;

        // より詳細な結果ログ
        const result = {
            url,
            isIndexed,
            foundNoIndexSignal: notIndexedSignals.find(signal => html.includes(signal)) || 'none',
            foundIndexSignals: indexedSignals.filter(signal => html.includes(signal)),
            responseStatus: response.status,
            responseOk: response.ok
        };

        console.log('Index check result:', result);

        await IndexStatusCache.set(url, isIndexed);
        return isIndexed;

    } catch (error) {
        console.error('インデックス確認中にエラーが発生しました:', error);
        console.error('Error details:', error.message, error.stack);

        // エラー情報をより詳細に
        const errorDetails = {
            message: error.message,
            stack: error.stack,
            url: url,
            timestamp: new Date().toISOString()
        };

        console.error('Detailed error information:', errorDetails);
        return null;
    }
}

// URLが監視対象のドメインに属しているかチェック
function isTargetUrl(url, targetDomains) {
    try {
        if (!targetDomains?.length) return false;

        // URLオブジェクトを作成
        const urlObj = new URL(url);
        const hostname = urlObj.hostname;

        console.log('Checking hostname:', hostname);

        // ホスト名が監視対象ドメインと完全一致するか、
        // またはサブドメインとして含まれているかをチェック
        return targetDomains.some(domain =>
            hostname === domain ||
            hostname.endsWith(`.${domain}`)
        );
    } catch (error) {
        console.error('Invalid URL:', url);
        return false;
    }
}

// タブ更新時の処理
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status !== 'complete') return;

    const currentUrl = tab.url;
    console.log(`Tab updated: ${currentUrl}`);

    // 特定のURLは除外（Google検索やSearch Console等）
    const excludedDomains = [
        'google.com',
        'google.co.jp',
        'chrome-extension://'
    ];

    try {
        const urlObj = new URL(currentUrl);
        if (excludedDomains.some(domain => urlObj.hostname.includes(domain))) {
            console.log('Excluded domain, skipping check');
            await updateIcon(tabId, null);
            return;
        }
    } catch (error) {
        console.error('Invalid URL:', currentUrl);
        await updateIcon(tabId, null);
        return;
    }

    // 登録済みドメインかチェック
    const { targetDomains = [] } = await chrome.storage.sync.get('targetDomains');
    console.log('Target domains:', targetDomains);

    // targetDomainsが空の場合も考慮
    if (!targetDomains || !targetDomains.length) {
        console.log('No target domains configured');
        await updateIcon(tabId, null);
        return;
    }

    // isTargetUrl関数を使用して判定
    if (!isTargetUrl(currentUrl, targetDomains)) {
        console.log('URL not in target domains:', currentUrl);
        await updateIcon(tabId, null);
        return;
    }

    // 以降の処理は対象URLの場合のみ実行
    console.log('URL is in target domains, proceeding with check');

    // キャッシュチェック
    const cache = await IndexStatusCache.get(currentUrl);
    if (cache) {
        console.log('Using cached result:', cache);
        await updateIcon(tabId, cache.isIndexed);
        return;
    }

    // インデックス状況を確認
    console.log('Checking fresh index status');
    const isIndexed = await checkIndexStatus(currentUrl);
    await updateIcon(tabId, isIndexed);
});

// アイコンの色を変更
async function updateIcon(tabId, status) {
    const iconName = status === null ? 'gray' :
        status === true ? 'green' : 'red';

    console.log(`Updating icon for tab ${tabId} to ${iconName}`);

    await chrome.action.setIcon({
        tabId,
        path: {
            16: `icons/icon-${iconName}-16.png`,
            48: `icons/icon-${iconName}-48.png`,
            128: `icons/icon-${iconName}-128.png`
        }
    });
}

// メッセージハンドラを追加
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'checkIndexStatus') {
        checkIndexStatus(message.url).then(result => {
            sendResponse({ isIndexed: result });
        });
        return true; // 非同期レスポンスを示す
    }
});
