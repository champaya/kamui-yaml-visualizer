import { load } from "js-yaml";
import { YamlData, FileNode, FileEdge, YamlFile } from "../types/yaml";

/**
 * YAMLテキストを解析してYamlDataオブジェクトに変換する
 * @param {string} yamlString - 解析するYAMLテキスト
 * @returns {YamlData} 解析されたYAMLデータ
 */
export function parseYaml(yamlString: string): YamlData {
  return load(yamlString) as YamlData;
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
  const VERTICAL_SPACING = 250; // 垂直方向の間隔
  const HORIZONTAL_SPACING = 500; // 水平方向の間隔
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
 * YAMLデータからReactFlow用のノードとエッジを生成する
 * @param {YamlData} yamlData - 解析済みのYAMLデータ
 * @returns {{nodes: FileNode[], edges: FileEdge[], agents: Set<string>}}
 * ノード、エッジ、使用エージェントのセット
 */
export function generateNodesAndEdges(yamlData: YamlData) {
  const nodes: FileNode[] = [];
  const edges: FileEdge[] = [];
  const agents = new Set<string>();

  // structure.yamlのノードを作成
  const structureNode: FileNode = {
    id: "src/structure.yaml",
    type: "default",
    data: {
      label: "structure.yaml",
      content: yamlData.src["structure.yaml"]?.content,
      agent: yamlData.src["structure.yaml"]?.agent,
      extension: "yaml",
    },
    position: { x: 0, y: 0 },
    style: {
      border: "none",
      width: "420px",
    },
  };
  nodes.push(structureNode);
  agents.add(yamlData.src["structure.yaml"]?.agent);

  // その他のファイルを処理
  Object.entries(yamlData.src).forEach(([key, value]) => {
    if (key === "structure.yaml") return;

    if ("content" in value && typeof value.content === "string") {
      // 単一ファイルの場合の処理
      const fileData = value as YamlFile;
      const fullPath = `src/${key}`;
      const node: FileNode = {
        id: fullPath,
        type: "default",
        data: {
          label: key,
          content: fileData?.content,
          agent: fileData?.agent,
          extension: key.split(".").pop() || "",
        },
        position: { x: 0, y: 0 },
        style: {
          border: "none",
          width: "420px",
        },
      };
      nodes.push(node);
      agents.add(fileData?.agent);

      // 依存関係のエッジを追加
      if (fileData.dependency && fileData.dependency.length > 0) {
        fileData.dependency.forEach((dep) => {
          edges.push({
            id: `${fullPath}-${dep}`,
            source: dep,
            target: fullPath,
          });
        });
      }
    } else {
      // ディレクトリ内のファイルを処理
      Object.entries(value as { [key: string]: YamlFile }).forEach(
        ([filename, fileData]) => {
          const fullPath = `src/${key}/${filename}`;
          const node: FileNode = {
            id: fullPath,
            type: "default",
            data: {
              label: filename,
              content: fileData?.content,
              agent: fileData?.agent,
              extension: filename.split(".").pop() || "",
            },
            position: { x: 0, y: 0 },
            style: {
              border: "none",
              width: "420px",
            },
          };
          nodes.push(node);
          agents.add(fileData?.agent);

          // 依存関係のエッジを追加（srcで始まるパスのみ）
          if (fileData.dependency && fileData.dependency.length > 0) {
            fileData.dependency.forEach((dep) => {
              if (dep.startsWith("src/")) {
                edges.push({
                  id: `${fullPath}-${dep}`,
                  source: dep,
                  target: fullPath,
                });
              }
            });
          }
        }
      );
    }
  });

  // ノードの位置を計算して適用
  const positions = calculateNodePositions(nodes, edges);
  nodes.forEach((node) => {
    if (positions[node.id]) {
      node.position = positions[node.id];
    }
  });

  return { nodes, edges, agents };
}

/**
 * ファイル拡張子に応じた色を返す
 * @param {string} extension - ファイルの拡張子
 * @returns {string} 対応する色のHEXコード
 */
export const getExtensionColor = (extension: string): string => {
  const colors: { [key: string]: string } = {
    png: "#4CAF50", // 緑
    glb: "#2196F3", // 青
    css: "#9C27B0", // 紫
    marp: "#FF9800", // オレンジ
    mmd: "#795548", // 茶
    mp4: "#F44336", // 赤
    mp3: "#E91E63", // ピンク
    md: "#607D8B", // グレー
    yaml: "#FFC107", // 黄
  };

  return colors[extension] || "#9E9E9E"; // デフォルトはグレー
};
