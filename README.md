# google-index-checker

Google検索でウェブページがインデックスされているかをワンクリックで確認できるChrome拡張機能

Chrome extension to instantly check if your webpage is indexed by Google Search

## 機能 / Features

- 現在表示中のページがGoogleにインデックスされているかを即座に確認
- ワンクリックでGoogle検索結果を表示
- シンプルで使いやすいインターフェース

## インストール / Installation

1. Chrome Web Store からインストール（準備中）
2. または、このリポジトリをクローンして開発者モードでインストール:

   ```bash
   git clone https://github.com/yourusername/google-index-checker.git
   ```

   - Chrome で `chrome://extensions` を開く
   - 「デベロッパーモード」を有効化
   - 「パッケージ化されていない拡張機能を読み込む」をクリック
   - クローンしたディレクトリを選択

## 使い方 / Usage

1. インストール後、Chrome のツールバーに表示されるアイコンをクリック
2. 現在表示中のページのインデックス状況が自動的にチェックされます
3. 「インデックス要求」ボタンをクリックすると、クリップボードにURLがコピーされ、Search Consoleにリダイレクトされます
4. URLを貼り付けてインデックスをリクエストできます

## 開発者向け情報 / For Developers

### 必要要件 / Requirements

- Chrome ブラウザ
- Git (開発に参加する場合)

### セットアップ / Setup

1. リポジトリをクローン:

```bash
git clone https://github.com/yourusername/google-index-checker.git
```

2. Chrome で拡張機能をインストール:
   - Chrome で `chrome://extensions` を開く
   - 「デベロッパーモード」を有効化
   - 「パッケージ化されていない拡張機能を読み込む」をクリック
   - クローンしたディレクトリを選択

## 技術スタック / Tech Stack

- TypeScript
- React
- Chrome Extensions API
- Vite

## ライセンス / License

MIT License

## コントリビューション / Contributing

1. このリポジトリをフォーク
2. 新しいブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## サポート / Support

問題や提案がある場合は、GitHubのIssueを作成してください。

## 謝辞 / Acknowledgments

- [Chrome Extensions Documentation](https://developer.chrome.com/docs/extensions/)
- [React Documentation](https://reactjs.org/)
