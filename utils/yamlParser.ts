import { load } from "js-yaml";
import {
  YamlData,
  YamlFile,
  FileNode,
  FileEdge,
  DirectoryContent,
} from "@/types/yaml";
import {
  jsColor,
  tsColor,
  jsxColor,
  tsxColor,
  cssColor,
  htmlColor,
  yamlColor,
  dartColor,
  pythonColor,
  pngColor,
  glbColor,
  mp4Color,
  mp3Color,
  marpColor,
  mmdColor,
  mdColor,
  defaultColor,
  defaultVerticalSpacing,
  defaultHorizontalSpacing,
  defaultNodeWidth,
} from "@/constant/constant";

/**
 * YAMLテキストを解析してデータ構造に変換
 * @param {string} yamlText - 解析するYAMLテキスト
 * @returns {YamlData} 解析されたYAMLデータ
 */
export function parseYaml(yamlText: string): YamlData {
  return load(yamlText) as YamlData;
}

/**
 * ファイルパスから拡張子を取得
 * @param {string} path - ファイルパス
 * @returns {string} ファイルの拡張子
 */
export function getFileExtension(path: string): string {
  return path.split(".").pop() || "";
}

/**
 * 拡張子に基づいて色を取得
 * @param {string} extension - ファイルの拡張子
 * @returns {string} 対応する色のHEXコード
 */
export function getExtensionColor(extension: string = ""): string {
  // ファイル拡張子ごとの色を定義するマップ
  // プログラミング言語系
  const colorMap: { [key: string]: string } = {
    js: jsColor, // JavaScript - 黄色
    ts: tsColor, // TypeScript - 青
    jsx: jsxColor, // React JSX - 水色
    tsx: tsxColor, // React TSX - 薄い青
    css: cssColor, // CSS - 濃い青
    html: htmlColor, // HTML - オレンジ赤
    yaml: yamlColor, // YAML - 赤
    dart: dartColor, // Dart - 緑
    python: pythonColor, // Python - 青

    // メディアファイル系
    png: pngColor, // PNG画像 - 緑
    glb: glbColor, // 3Dモデル - 紫
    mp4: mp4Color, // 動画 - 赤
    mp3: mp3Color, // 音声 - ピンク

    // ドキュメント系
    marp: marpColor, // Marpスライド - オレンジ
    mmd: mmdColor, // Mermaid図 - 茶色
    md: mdColor, // Markdown - グレー
  };

  // 未定義の拡張子の場合はデフォルトのグレーを返す
  return colorMap[extension.toLowerCase()] || defaultColor;
}

/**
 * ノードの位置を計算する内部関数
 * @param {FileNode[]} nodes - 配置するノードの配列
 * @param {FileEdge[]} edges - ノード間の依存関係を表すエッジの配列
 * @returns {Object.<string, {x: number, y: number}>} ノードIDをキーとする位置情報のマップ
 */
function calculateNodePositions(nodes: FileNode[], edges: FileEdge[]) {
  // ノードの位置情報を格納するオブジェクト
  const positions: { [key: string]: { x: number; y: number } } = {};
  // 各ノードのレベル（階層）を格納するオブジェクト
  const levels: { [key: string]: number } = {};
  // 各レベルに属するノードIDを格納するオブジェクト
  const nodesPerLevel: { [key: number]: string[] } = {};

  // 依存関係のないノード（ルートノード）を特定
  const startNodes = nodes
    .filter((node) => !edges.some((edge) => edge.target === node.id))
    .map((node) => node.id);

  /**
   * 再帰的にノードのレベルを計算する内部関数
   * @param {string} nodeId - 処理対象のノードID
   * @param {number} level - 現在の階層レベル
   */
  function calculateLevel(nodeId: string, level: number) {
    // 既に計算済みの場合は、より深い階層を採用
    if (levels[nodeId] !== undefined) {
      levels[nodeId] = Math.max(levels[nodeId], level);
    } else {
      levels[nodeId] = level;
    }

    // レベルごとのノード配列を初期化・追加
    if (!nodesPerLevel[level]) {
      nodesPerLevel[level] = [];
    }
    nodesPerLevel[level].push(nodeId);

    // 子ノードに対して再帰的に処理
    const childEdges = edges.filter((edge) => edge.source === nodeId);
    childEdges.forEach((edge) => {
      calculateLevel(edge.target, level + 1);
    });
  }

  // ルートノードから階層計算を開始
  startNodes.forEach((nodeId) => calculateLevel(nodeId, 0));

  // レイアウトの設定値
  const VERTICAL_SPACING = defaultVerticalSpacing; // 垂直方向の間隔
  const HORIZONTAL_SPACING = defaultHorizontalSpacing; // 水平方向の間隔
  const STAGGER_OFFSET = 100; // 千鳥配置のオフセット

  // 各レベルのノードに位置を割り当て
  Object.entries(nodesPerLevel).forEach(([level, nodeIds]) => {
    const levelNum = parseInt(level);
    const totalWidth = (nodeIds.length - 1) * HORIZONTAL_SPACING;
    const startX = -totalWidth / 2;

    nodeIds.forEach((nodeId, index) => {
      // 偶数レベルと奇数レベルで水平方向にずらして千鳥配置
      const staggerX = levelNum % 2 === 0 ? 0 : STAGGER_OFFSET;

      positions[nodeId] = {
        x: startX + index * HORIZONTAL_SPACING + staggerX,
        y: levelNum * VERTICAL_SPACING,
      };
    });
  });

  return positions;
}

/**
 * ディレクトリ構造を再帰的に処理してノードとエッジを生成
 * @param {DirectoryContent|YamlFile} content - 処理するコンテンツ
 * @param {string} parentPath - 親ディレクトリのパス
 * @param {FileNode[]} nodes - ノードの配列
 * @param {FileEdge[]} edges - エッジの配列
 * @param {Set<string>} agents - エージェントの集合
 */
function processDirectory(
  content: DirectoryContent | YamlFile,
  parentPath: string,
  nodes: FileNode[],
  edges: FileEdge[],
  agents: Set<string>
) {
  // YamlFileかどうかを型ガードで判定
  const isYamlFile = (value: any): value is YamlFile => {
    return (
      typeof value === "object" &&
      value !== null &&
      "content" in value &&
      "dependency" in value &&
      "agent" in value &&
      "api" in value
    );
  };

  if (isYamlFile(content)) {
    // YamlFileの場合
    const filePath = parentPath;
    const fileName = filePath.split("/").pop() || "";

    // ノードを追加
    nodes.push({
      id: filePath,
      type: "default",
      data: {
        label: fileName,
        content: content.content,
        agent: content.agent,
        extension: getFileExtension(fileName),
      },
      position: { x: Math.random() * 500, y: Math.random() * 500 },
      style: { border: "1px solid #ddd", width: defaultNodeWidth },
    });

    // エージェントを追加
    agents.add(content.agent);

    // 依存関係のエッジを追加
    content.dependency.forEach((dep) => {
      edges.push({
        id: `${filePath}-${dep}`,
        source: filePath,
        target: dep,
      });
    });
  } else {
    // DirectoryContentの場合、再帰的に処理
    Object.entries(content).forEach(([key, value]) => {
      const newPath = parentPath ? `${parentPath}/${key}` : key;
      processDirectory(value, newPath, nodes, edges, agents);
    });
  }
}

/**
 * YAMLデータからノードとエッジを生成
 * @param {YamlData} yamlData - 解析されたYAMLデータ
 * @returns {Object} ノード、エッジ、エージェントの情報を含むオブジェクト
 */
export function generateNodesAndEdges(yamlData: YamlData) {
  const nodes: FileNode[] = [];
  const edges: FileEdge[] = [];
  const agents: Set<string> = new Set();

  processDirectory(yamlData.src, "src", nodes, edges, agents);

  // ノードの位置を計算して適用
  const positions = calculateNodePositions(nodes, edges);
  nodes.forEach((node) => {
    if (positions[node.id]) {
      node.position = positions[node.id];
    }
  });

  return { nodes, edges, agents };
}
