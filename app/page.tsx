"use client";

import { useState, useCallback, useEffect } from "react";
import { YamlVisualizer } from "@/components/YamlVisualizer";
import { parseYaml } from "@/utils/yamlParser";
import { YamlData } from "@/types/yaml";
import debounce from "lodash.debounce";

/**
 * YAMLビジュアライザーのメインページコンポーネント
 * YAMLテキストの入力と解析結果の表示を管理
 */
export default function Home() {
  // 状態管理
  const [yamlData, setYamlData] = useState<YamlData | null>(null);
  const [yamlText, setYamlText] = useState<string>("");
  const [parseError, setParseError] = useState<string | null>(null);

  /**
   * YAMLテキストの変更を処理するコールバック
   * 入力値を状態に保存し、デバウンスされた解析を実行
   */
  const handleYamlChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setYamlText(e.target.value);
      debouncedParse(e.target.value);
    },
    []
  );

  /**
   * YAMLテキストを解析する関数
   * 解析結果または解析エラーを状態に保存
   * @param {string} text - 解析するYAMLテキスト
   */
  const parseInputYaml = useCallback((text: string) => {
    // 空のテキストの場合は状態をクリア
    if (text.trim() === "") {
      setYamlData(null);
      setParseError(null);
      return;
    }

    try {
      // YAMLテキストを解析
      const data = parseYaml(text);
      setYamlData(data);
      setParseError(null);
    } catch (error) {
      console.error("Error parsing YAML:", error);
      setParseError("YAMLの解析に失敗しました。内容を確認してください。");
      setYamlData(null);
    }
  }, []);

  // 入力が停止してから500ms後に解析を実行するデバウンス処理
  const debouncedParse = useCallback(debounce(parseInputYaml, 500), [
    parseInputYaml,
  ]);

  // コンポーネントのクリーンアップ時にデバウンスをキャンセル
  useEffect(() => {
    return () => {
      debouncedParse.cancel();
    };
  }, [debouncedParse]);

  /**
   * 入力と状態をリセットするコールバック
   */
  const handleReset = useCallback(() => {
    setYamlData(null);
    setYamlText("");
    setParseError(null);
  }, []);

  return (
    <main className="min-h-screen flex">
      {/* YAML入力エリア */}
      <div className="w-1/3 flex flex-col items-center justify-start bg-gray-50 p-4 overflow-auto">
        <h1 className="text-3xl font-bold mb-8">グリモワール グラフ</h1>
        <div className="w-full bg-white p-4 rounded-lg shadow-md">
          <div className="text-center mb-4">
            <p className="text-gray-600 mb-2">
              YAMLテキストを入力してください。
            </p>
            {/* エラーメッセージの表示 */}
            {parseError && (
              <p className="text-red-500 font-bold">{parseError}</p>
            )}
          </div>
          {/* YAMLテキスト入力エリア */}
          <textarea
            value={yamlText}
            onChange={handleYamlChange}
            placeholder="ここにYAMLを入力..."
            className="w-full h-[50rem] p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          {/* リセットボタン */}
          <button
            onClick={handleReset}
            className="mt-4 w-full px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
          >
            リセット
          </button>
        </div>
      </div>

      {/* 解析結果表示エリア */}
      <div className="w-2/3 flex flex-col items-center justify-start bg-white p-4 overflow-auto">
        {yamlData ? (
          <>
            {/* 別の入力を選択するボタン */}
            <div className="fixed top-4 right-4 z-10">
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-white rounded-md shadow-md hover:bg-gray-50"
              >
                別の入力を選択
              </button>
            </div>
            {/* YAMLビジュアライザーコンポーネント */}
            <div className="w-full h-full">
              <YamlVisualizer yamlData={yamlData} />
            </div>
          </>
        ) : (
          // YAMLデータがない場合のプレースホルダー
          <div className="w-full max-w-2xl p-6 rounded-lg shadow-md flex items-center justify-center">
            <p className="text-gray-600">右側に解析結果が表示されます。</p>
          </div>
        )}
      </div>
    </main>
  );
}
