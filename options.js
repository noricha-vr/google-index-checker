class DomainManager {
    constructor() {
        this.domains = [];
        this.domainInput = document.getElementById('domain-input');
        this.addButton = document.getElementById('add-button');
        this.domainList = document.getElementById('domain-list');

        this.init();
    }

    async init() {
        // イベントリスナーの設定
        this.addButton.addEventListener('click', () => this.addDomain());
        this.domainInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') this.addDomain();
        });

        // 保存済みドメインの読み込み
        const { targetDomains = [] } = await chrome.storage.sync.get('targetDomains');
        this.domains = targetDomains;
        this.renderDomainList();
    }

    async addDomain() {
        const newDomain = this.domainInput.value.trim();
        if (!newDomain) return;

        // ドメインのバリデーション
        try {
            new URL(`https://${newDomain}`);
        } catch {
            alert('有効なドメインを入力してください');
            return;
        }

        if (!this.domains.includes(newDomain)) {
            this.domains.push(newDomain);
            await this.saveDomains();
            this.renderDomainList();
        }

        this.domainInput.value = '';
    }

    async removeDomain(domain) {
        this.domains = this.domains.filter(d => d !== domain);
        await this.saveDomains();
        this.renderDomainList();
    }

    async saveDomains() {
        await chrome.storage.sync.set({ targetDomains: this.domains });
    }

    renderDomainList() {
        this.domainList.innerHTML = '';

        this.domains.forEach(domain => {
            const item = document.createElement('div');
            item.className = 'domain-item';

            const text = document.createElement('span');
            text.textContent = domain;

            const removeButton = document.createElement('button');
            removeButton.textContent = '削除';
            removeButton.onclick = () => this.removeDomain(domain);

            item.appendChild(text);
            item.appendChild(removeButton);
            this.domainList.appendChild(item);
        });
    }
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    new DomainManager();
}); 
