/**
 * YAMLファイルの基本構造を表すインターフェース
 * @interface YamlFile
 * @property {string} content - ファイルの内容説明
 * @property {string[]} dependency - 依存するファイルパスの配列
 * @property {string} agent - 使用するAIエージェントの識別子
 * @property {string[]} api - 使用するAPIのリスト
 * @property {boolean} [dependency_wait] - 依存ファイルの完了を待つかどうか（オプション）
 */
export interface YamlFile {
  content: string;
  dependency: string[];
  agent: string;
  api: string[];
  dependency_wait?: boolean;
}

/**
 * structure.yamlファイルの構造を表すインターフェース
 * @interface YamlStructure
 * @property {string} content - プロジェクトの概要説明
 * @property {string[]} dependency - プロジェクトが依存するファイルパスの配列
 * @property {string} agent - 使用するAIエージェントの識別子
 * @property {string[]} api - 使用するAPIのリスト
 */
export interface YamlStructure {
  content: string;
  dependency: string[];
  agent: string;
  api: string[];
}

/**
 * YAMLデータ全体の構造を表すインターフェース
 * @interface YamlData
 * @property {Object} src - プロジェクトのルートディレクトリ
 * @property {YamlStructure} src.structure.yaml - プロジェクトの構造定義ファイル
 * @property {Object.<string, YamlFile|YamlStructure>} src - その他のファイルやディレクトリ
 */
export interface YamlData {
  src: {
    "structure.yaml": YamlStructure;
    [key: string]:
      | {
          [key: string]: YamlFile;
        }
      | YamlStructure;
  };
}

/**
 * ReactFlowのノードを表すインターフェース
 * @interface FileNode
 * @property {string} id - ノードの一意識別子（ファイルパス）
 * @property {string} type - ノードのタイプ（"default"固定）
 * @property {Object} data - ノードのデータ
 * @property {string} data.label - ノードのラベル（ファイル名）
 * @property {string} data.content - ファイルの内容説明
 * @property {string} data.agent - 使用するAIエージェント
 * @property {string[]} data.api - 使用するAPIリスト
 * @property {string} data.extension - ファイルの拡張子
 * @property {Object} position - ノードの位置
 * @property {number} position.x - X座標
 * @property {number} position.y - Y座標
 * @property {Object} style - ノードのスタイル
 * @property {string} style.border - ボーダースタイル
 * @property {string} style.width - ノードの幅
 */
export interface FileNode {
  id: string;
  type: string;
  data: {
    label?: string;
    content?: string;
    agent?: string;
    extension?: string;
  };
  position: { x: number; y: number };
  style: {
    border: string;
    width: string;
  };
}

/**
 * ReactFlowのエッジ（依存関係の矢印）を表すインターフェース
 * @interface FileEdge
 * @property {string} id - エッジの一意識別子
 * @property {string} source - 依存元のノードID
 * @property {string} target - 依存先のノードID
 */
export interface FileEdge {
  id: string;
  source: string;
  target: string;
}
