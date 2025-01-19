# To Kamui Team

## 起動方法
```sh
npm install
npm run dev
```

## 機能

- yaml ファイルをテキストエリアに入力して、右側にファイルノードとエッジを表示（ノードはファイル名、conetnt, agent 表示）
- yaml ファイルをテキストエリアに入力して、使用されているエージェントを画面下側に表示
- テキストエリアの yaml ファイルを変更して、リアルタイムでグラフを更新（yaml の構文エラーの場合上部にエラーを表示。ただし、yaml の構文エラーをチェックしているだけで、グリモワールスキーマのチェックではない）
- リセットボタンでグラフリセット（リセットを押さないと、前回のグラフが残ってしまう）

## できないこと

- フォルダの表現。現在はファイルのみをノードで表現している
- グリモワールとしてのスキーマチェック

## フォルダ構造

- app: メインのファイル
- components: グラフ表示コンポーネント
- constant: 定数
- types: 型
- utils: yaml 解析の関数

## その他メモ

1. constant フォルダに定数を少しまとめています。
   ノードの色指定と、ノードの横幅、ノード間の間隔を定義しています。
2. 今は一つのページとして実装していますが、page.tsx から YamlVisualizer.tsx に送る props`yamlData`をグリモワール図書館に格納されている yaml ファイルから取得するようにすれば、組み込めると思います。
3. 依存パッケージは package.json をご確認ください

## ※注意

本番環境での動作は確認していません。厳密なテストはしていません（動作確認レベルです）。
ビルド/デプロイ時のエラーや本番環境でのエラーが発生する可能性がございます。ご注意ください。
