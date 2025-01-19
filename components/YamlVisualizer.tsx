import React, { useCallback, useMemo } from "react";
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  Handle,
  Position,
  useReactFlow,
  ReactFlowProvider,
  NodeProps,
} from "reactflow";
import "reactflow/dist/style.css";
import { YamlData } from "@/types/yaml";
import { generateNodesAndEdges, getExtensionColor } from "@/utils/yamlParser";
import {
  defaultHorizontalSpacing,
  defaultVerticalSpacing,
} from "@/constant/constant";

/**
 * カスタムノードコンポーネント
 * ファイルの詳細情報を表示するノード
 * @param {NodeProps} props - ノードのプロパティ
 */
function CustomNode({ data }: NodeProps) {
  const extensionColor = getExtensionColor(data.extension);

  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-white">
      <Handle type="target" position={Position.Top} className="w-2 h-2" />
      <div className="flex flex-col">
        <div className="flex items-center">
          <div
            className="w-3 h-3 rounded-full mr-2"
            style={{ backgroundColor: extensionColor }}
          />
          <div className="text-sm font-bold">{data.label}</div>
        </div>
        <div className="mt-2 text-xs">
          <div className="text-gray-500 text-left">
            {data.content?.split("\n").slice(0, 2).join("\n")}
          </div>
          <div className="mt-2 text-gray-400 text-left">
            <span className="font-bold">Agent:</span> {data.agent}
          </div>
          {data.api && data.api.length > 0 && (
            <div className="text-gray-400 text-left">
              <span className="font-bold">API:</span> {data.api.join(", ")}
            </div>
          )}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-2 h-2" />
    </div>
  );
}

/**
 * YAMLビジュアライザーのメインコンポーネント
 * ReactFlowProviderでラップして状態管理を提供
 * @param {yamlData} props - YAMLデータを含むプロパティ
 */
export function YamlVisualizer({ yamlData }: { yamlData: YamlData }) {
  return (
    <ReactFlowProvider>
      <YamlVisualizerContent yamlData={yamlData} />
    </ReactFlowProvider>
  );
}

/**
 * YAMLビジュアライザーの内部コンテンツコンポーネント
 * グラフの描画とインタラクションを管理
 * @param {yamlData} props - YAMLデータを含むプロパティ
 */
function YamlVisualizerContent({ yamlData }: { yamlData: YamlData }) {
  // YAMLデータからノードとエッジを生成
  const {
    nodes: initialNodes,
    edges: initialEdges,
    agents,
  } = generateNodesAndEdges(yamlData);

  // ReactFlowの状態管理フック
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    initialEdges.map((edge) => ({
      ...edge,
      type: "smoothstep",
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
      },
      animated: true,
      style: { stroke: "#666", strokeWidth: 2 },
    }))
  );

  const { fitView } = useReactFlow();

  /**
   * ノードの自動レイアウトを実行する関数
   * グリッド状にノードを配置
   */
  const handleAutoLayout = useCallback(() => {
    const VERTICAL_SPACING = defaultVerticalSpacing; // 垂直方向の間隔
    const HORIZONTAL_SPACING = defaultHorizontalSpacing; // 水平方向の間隔
    const newNodes = nodes.map((node, index) => {
      const column = index % 3;
      const row = Math.floor(index / 3);
      return {
        ...node,
        position: {
          x: column * HORIZONTAL_SPACING,
          y: row * VERTICAL_SPACING,
        },
      };
    });
    setNodes(newNodes);
    // レイアウト後にビューを調整
    setTimeout(() => fitView({ padding: 0.2 }), 100);
  }, [nodes, setNodes, fitView]);

  /**
   * ノード間の接続を処理するコールバック
   */
  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // カスタムノードタイプのメモ化
  const nodeTypes = useMemo(() => ({ default: CustomNode }), []);

  // エッジのデフォルト設定
  const defaultEdgeOptions = {
    animated: true,
    type: "smoothstep",
  };

  return (
    <div className="h-screen">
      <div className="h-[80vh] relative">
        {/* 自動レイアウトボタン */}
        <button
          onClick={handleAutoLayout}
          className="absolute top-16 right-4 z-10 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 shadow-md"
        >
          自動レイアウト
        </button>
        {/* ReactFlowグラフ */}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          fitView
          attributionPosition="bottom-left"
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
      {/* エージェント一覧表示エリア */}
      <div className="h-[20vh] p-4 bg-gray-50">
        <h3 className="text-lg font-bold mb-2">使用されているエージェント:</h3>
        <div className="flex flex-wrap gap-2">
          {Array.from(agents)
            .filter((agent) => agent) // undefinedやnullを除外
            .map((agent) => (
              <span
                key={agent}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                {agent}
              </span>
            ))}
        </div>
      </div>
    </div>
  );
}
