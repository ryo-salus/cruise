# Kagoshima Port Questionnaire Tool

質問票を貼るかドロップすると、`port_facts.json` の台帳から回答を組み立てる。
台帳に無いことは答えない。空欄で返すのが正しい動作。

## ファイル構成

```
index.html                    画面とロジック（1ファイル完結）
port_facts.json               台帳。更新するのはここだけ
netlify/functions/answer.js   APIキーを隠すための中継
netlify.toml                  Netlify設定
```

## 公開手順

1. GitHubで新規リポジトリを作り、この4ファイルをアップロードする
2. Netlify で **Add new site → Import an existing project** から、そのリポジトリを選ぶ
3. ビルド設定は `netlify.toml` が持っているので、そのまま Deploy でよい
4. **Site configuration → Environment variables** に以下を追加する

   | Key | Value |
   |---|---|
   | `ANTHROPIC_API_KEY` | 自分のAPIキー |

5. 追加後に **Deploys → Trigger deploy** で再デプロイする（環境変数は再デプロイしないと反映されない）

APIキーはブラウザに一切渡らない。`answer.js` の中だけで使われる。

## 台帳の更新

`port_facts.json` をGitHubのブラウザ上で直接編集して commit すれば、Netlifyが自動で再デプロイする。
`index.html` は触らなくてよい。

### 未登録項目の追加

質問票を処理したあと **Draft ledger entries for gaps** を押すと、
台帳に無かった質問がJSONの雛形として出てくる。
`key` と `value` を埋めて `facts` 配列の末尾に貼るだけでよい。

これを毎回やると台帳が育つ。やらないと同じ質問に毎回手で答え続けることになる。

### status の意味

| status | 扱い |
|---|---|
| `confirmed` | 複数ソースで一致。そのまま出力される |
| `single_source` | 1ソースのみ。出力されるが裏取り推奨 |
| `conflict` | 矛盾あり。両方の値と出典が並んで出る |
| `placeholder` | 寄港ごと・船社ごとに変わる。角括弧で空欄が出る |

### volatility の意味

| volatility | 見直し頻度 |
|---|---|
| `stable` | 構造物・地理。ほぼ不要 |
| `periodic` | 料金・設備。年1回は見直す |
| `per_call` | 寄港ごと。台帳から埋めてはいけない |
| `per_line` | 船社ごと。台帳から埋めてはいけない |
| `expiring` | 有効期限あり。`as_of` とセットで確認 |

## 既知の制約

- **台帳はマリンポート鹿児島1号岸壁のみ。** 2号岸壁・北ふ頭1号は未収録。
  他バースの質問は `unmatched` で返るようプロンプトで指示済みだが、
  該当する寄港が発生する前にデータを足しておくこと。
- 矛盾8件が未確定。`port_facts.json` 冒頭の `conflicts_requiring_resolution` を参照。
- 為替レートは2024年7月時点のまま（`tourist.exchange_rate`）。出力前に要更新。
