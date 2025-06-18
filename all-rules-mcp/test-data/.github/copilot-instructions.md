# Copilot Instructions

このプロジェクトでは、以下のコーディング規約に従ってください。

## 言語とフレームワーク

- TypeScriptを使用し、すべての型注釈を明示的に記述する
- Reactコンポーネントは必ず関数コンポーネントで書き、Hooksを使用する
- Next.jsのApp Routerを使用する

## コーディング規約

- 変数名はcamelCase、クラス名はPascalCaseを使用
- ESLintとPrettierの設定に準拠する
- すべてのpublic関数にはJSDocコメントを記述する

## テスト

- Jest とReact Testing Libraryを使用してユニットテストを実装
- 各コンポーネントに最低1つのテストケースを作成
- カバレッジは80%以上を維持する

## ファイル構成

- *.tsx ファイルはコンポーネント用
- *.ts ファイルはユーティリティ関数用
- テストファイルは *.test.tsx または *.test.ts

## API通信

- axiosライブラリを使用してHTTPリクエストを実行
- エラーハンドリングを適切に実装
- レスポンスの型定義を必ず作成する