// Canvas de grafo do editor de fluxos (Fase 2 — visual completo).
//
// Editor de NOS + ARESTAS (React Flow):
// - cada passo e um no arrastavel (posicao salva em definition.positions);
// - arrastar de um handle de saida para a entrada de outro no cria uma aresta;
// - arestas saindo de passos ramificados ganham rotulo de ramo editavel;
// - deletar aresta/no pela tecla Delete ou pelo "x" do no;
// - soltar uma acao do painel sobre o canvas cria o no na posicao do drop;
// - auto-organizar (layout em camadas via BFS, sem dependencia extra).
//
// Emite (onGraphChange) o grafo normalizado {edges, positions} pro editor, que
// persiste em definition. A emissao e DEFERIDA (setTimeout 0) e usa refs, pra
// nunca chamar setState do pai durante o render do canvas. Remonta por fluxo
// via key={flowId} no pai.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  useReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  type Node,
  type Edge,
  type Connection,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { AlertTriangle, Copy, X } from "lucide-react";
import { ACTION_ICONS, DRAG_MIME, type DragPayload } from "@/components/marketing/flow-actions";
import { isExecutableMarketingFlowAction, type MarketingFlowEdge } from "@/lib/marketing/flow-types";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------- Tipos

export type CanvasStep = {
  id: string;
  actionId: string;
  label: string;
  iconKey: string;
  iconClass: string;
  subtitle?: string;
  config?: Record<string, unknown>;
};

export type NodePositions = Record<string, { x: number; y: number }>;

type StepNodeData = {
  step: CanvasStep;
  onEdit: (id: string) => void;
  onRemove: (id: string) => void;
  onDuplicate?: (id: string) => void;
  invalid?: boolean;
};

type RFNode = Node<StepNodeData, "step">;

// Ramos pre-definidos por tipo de acao (mesma semantica do worker/flow-graph).
const SPLIT_ACTIONS = new Set(["dividir-caminho", "dividir-por-segmentacao"]);
const AB_TEST_ACTIONS = new Set(["teste-ab"]);
const WAIT_UNTIL_ACTIONS = new Set(["esperar-condicao"]);
const AI_CLASSIFY_ACTIONS = new Set(["classificar-ia"]);

function defaultBranchFor(actionId: string, existing: number): string | undefined {
  if (SPLIT_ACTIONS.has(actionId)) return existing === 0 ? "sim" : "não";
  if (WAIT_UNTIL_ACTIONS.has(actionId)) {
    return existing === 0 ? "condição atendida" : "tempo esgotado";
  }
  if (AB_TEST_ACTIONS.has(actionId)) {
    return `Variante ${String.fromCharCode(65 + existing)}`;
  }
  if (AI_CLASSIFY_ACTIONS.has(actionId)) {
    return `Categoria ${existing + 1}`;
  }
  return undefined; // linear
}

function isBranching(actionId: string): boolean {
  return (
    SPLIT_ACTIONS.has(actionId) ||
    AB_TEST_ACTIONS.has(actionId) ||
    WAIT_UNTIL_ACTIONS.has(actionId) ||
    AI_CLASSIFY_ACTIONS.has(actionId)
  );
}

// ---------------------------------------------------------------- No customizado

function StepNode({ data, selected }: NodeProps<RFNode>) {
  const { step, onEdit, onRemove, onDuplicate, invalid } = data;
  const Icon = ACTION_ICONS[step.iconKey];
  const noExecutor = !isExecutableMarketingFlowAction(step.actionId);
  const branching = isBranching(step.actionId);

  return (
    <div
      onClick={() => onEdit(step.id)}
      className={cn(
        "group relative flex w-64 cursor-pointer items-center gap-3 rounded-lg border bg-slate-800 px-3 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.35)] transition-all hover:shadow-[0_4px_16px_rgba(0,0,0,0.5)]",
        invalid
          ? "border-red-500/80 ring-2 ring-red-500/30"
          : selected
            ? "border-sky-400 ring-2 ring-sky-400/30"
            : noExecutor
              ? "border-amber-500/50"
              : "border-slate-600/80 hover:border-slate-400",
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3.5 !w-3.5 !border-2 !border-slate-400 !bg-slate-900 transition-colors hover:!border-sky-400"
      />
      <div className="absolute -right-2 -top-2 z-10 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {onDuplicate ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onDuplicate(step.id);
            }}
            aria-label={`Duplicar ${step.label}`}
            className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-600 bg-slate-800 text-slate-300 shadow-sm transition-colors hover:border-sky-400 hover:text-sky-400"
          >
            <Copy className="h-3.5 w-3.5" aria-hidden />
          </button>
        ) : null}
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onRemove(step.id);
          }}
          aria-label={`Remover ${step.label}`}
          className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-600 bg-slate-800 text-slate-300 shadow-sm transition-colors hover:border-red-400 hover:text-red-400"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
      <span
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-white shadow-inner",
          step.iconClass,
        )}
      >
        {Icon ? (
          <Icon className={cn("h-5 w-5", step.iconKey === "star" ? "fill-current" : "")} aria-hidden />
        ) : null}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-center gap-1.5 truncate text-sm font-semibold text-slate-100">
          {step.label}
          {invalid ? (
            <AlertTriangle className="h-3 w-3 shrink-0 text-red-400" aria-hidden />
          ) : noExecutor ? (
            <AlertTriangle className="h-3 w-3 shrink-0 text-amber-400" aria-hidden />
          ) : null}
        </span>
        {noExecutor ? (
          <span className="truncate text-xs text-amber-400/90">Ainda não executável</span>
        ) : step.subtitle ? (
          <span className="truncate text-xs text-slate-400">{step.subtitle}</span>
        ) : (
          <span className="truncate text-xs text-slate-500">Clique para configurar</span>
        )}
      </div>

      {/* Saida unica; ramos sao distinguidos pelo rotulo da aresta. */}
      <Handle
        type="source"
        position={Position.Right}
        className={cn(
          "!h-3.5 !w-3.5 !border-2 !bg-slate-900 transition-colors hover:!border-sky-400",
          branching ? "!border-amber-400" : "!border-slate-400",
        )}
      />
    </div>
  );
}

const NODE_TYPES = { step: StepNode };

// ---------------------------------------------------------------- Layout automatico

const NODE_W = 260;
const NODE_H = 90;
const GAP_X = 120;
const GAP_Y = 40;

/**
 * Layout em camadas (BFS) a partir da entrada: cada no fica na coluna do seu
 * nivel; nos do mesmo nivel empilham na vertical. Usado quando faltam posicoes
 * (fluxo legado) ou no botao "auto-organizar".
 */
function layeredPositions(
  steps: CanvasStep[],
  edges: MarketingFlowEdge[],
): NodePositions {
  if (steps.length === 0) return {};
  const adj = new Map<string, string[]>();
  const indeg = new Map<string, number>();
  for (const s of steps) {
    adj.set(s.id, []);
    indeg.set(s.id, 0);
  }
  for (const e of edges) {
    if (!adj.has(e.from) || !indeg.has(e.to)) continue;
    adj.get(e.from)!.push(e.to);
    indeg.set(e.to, (indeg.get(e.to) ?? 0) + 1);
  }
  // Nivel por BFS a partir dos nos sem entrada (ou o primeiro como fallback).
  const level = new Map<string, number>();
  const roots = steps.filter((s) => (indeg.get(s.id) ?? 0) === 0).map((s) => s.id);
  const queue = roots.length > 0 ? [...roots] : [steps[0].id];
  for (const r of queue) level.set(r, 0);
  while (queue.length > 0) {
    const id = queue.shift()!;
    const lv = level.get(id) ?? 0;
    for (const to of adj.get(id) ?? []) {
      const cand = lv + 1;
      if (!level.has(to) || cand > (level.get(to) ?? 0)) {
        level.set(to, cand);
        queue.push(to);
      }
    }
  }
  // Nos nao alcancados (orfaos) vao pra uma coluna final.
  const maxLevel = Math.max(0, ...Array.from(level.values()));
  for (const s of steps) if (!level.has(s.id)) level.set(s.id, maxLevel + 1);

  const perLevel = new Map<number, number>();
  const positions: NodePositions = {};
  for (const s of steps) {
    const lv = level.get(s.id) ?? 0;
    const row = perLevel.get(lv) ?? 0;
    perLevel.set(lv, row + 1);
    positions[s.id] = {
      x: lv * (NODE_W + GAP_X),
      y: row * (NODE_H + GAP_Y),
    };
  }
  return positions;
}

// ---------------------------------------------------------------- Canvas interno

type FlowCanvasProps = {
  steps: CanvasStep[];
  edges: MarketingFlowEdge[];
  positions: NodePositions;
  onEditStep: (id: string) => void;
  onRemoveStep: (id: string) => void;
  onDuplicateStep?: (id: string) => void;
  /** Ids de passos com erro de validacao: marcam o no com anel/icone. */
  invalidStepIds?: Set<string>;
  /** Emite o grafo normalizado sempre que arestas/posicoes mudam. */
  onGraphChange: (next: { edges: MarketingFlowEdge[]; positions: NodePositions }) => void;
  /** Soltar acao do painel: cria no na posicao do drop. */
  onDropAction: (payload: DragPayload, position: { x: number; y: number }) => void;
  /** Centraliza e seleciona o passo informado (ex.: ao clicar numa validacao). */
  focusStepId?: string | null;
  /** Chamado depois de focar, pra o pai limpar o focusStepId. */
  onFocusHandled?: () => void;
};

function toRFNodes(
  steps: CanvasStep[],
  positions: NodePositions,
  onEdit: (id: string) => void,
  onRemove: (id: string) => void,
  onDuplicate?: (id: string) => void,
  invalidStepIds?: Set<string>,
): RFNode[] {
  return steps.map((step, i) => ({
    id: step.id,
    type: "step",
    position: positions[step.id] ?? { x: i * (NODE_W + GAP_X), y: 0 },
    data: { step, onEdit, onRemove, onDuplicate, invalid: invalidStepIds?.has(step.id) ?? false },
  }));
}

/** Ramos sugeridos por tipo de acao, pra editar o rotulo da aresta sem digitar. */
function branchSuggestions(actionId: string): string[] {
  if (SPLIT_ACTIONS.has(actionId)) return ["sim", "não"];
  if (WAIT_UNTIL_ACTIONS.has(actionId)) return ["condição atendida", "tempo esgotado"];
  if (AB_TEST_ACTIONS.has(actionId)) return ["Variante A", "Variante B", "Variante C"];
  if (AI_CLASSIFY_ACTIONS.has(actionId)) return ["Categoria 1", "Categoria 2", "Categoria 3"];
  return [];
}

const BRANCH_EDGE_STYLE = { stroke: "#38bdf8", strokeWidth: 2 };
const DEFAULT_EDGE_STYLE = { stroke: "#64748b", strokeWidth: 1.5 };
const EDGE_LABEL_STYLE = { fontSize: 11, fontWeight: 600, fill: "#e2e8f0" } as const;
const EDGE_LABEL_BG_STYLE = { fill: "#1e293b", fillOpacity: 0.95 } as const;

function toRFEdges(edges: MarketingFlowEdge[]): Edge[] {
  return edges.map((e, i) => {
    const hasBranch = typeof e.branch === "string" && e.branch.trim().length > 0;
    return {
      id: `e-${e.from}-${e.to}-${i}`,
      source: e.from,
      target: e.to,
      label: e.branch,
      type: "smoothstep",
      animated: false,
      style: hasBranch ? BRANCH_EDGE_STYLE : DEFAULT_EDGE_STYLE,
      labelStyle: EDGE_LABEL_STYLE,
      labelBgStyle: EDGE_LABEL_BG_STYLE,
      labelBgPadding: [6, 2] as [number, number],
      labelBgBorderRadius: 6,
    };
  });
}

function rfEdgesToModel(edges: Edge[]): MarketingFlowEdge[] {
  return edges.map((e) => {
    const branch = typeof e.label === "string" && e.label.trim() ? e.label.trim() : undefined;
    return branch ? { from: e.source, to: e.target, branch } : { from: e.source, to: e.target };
  });
}

function FlowCanvasInner({
  steps,
  edges,
  positions,
  onEditStep,
  onRemoveStep,
  onDuplicateStep,
  invalidStepIds,
  onGraphChange,
  onDropAction,
  focusStepId,
  onFocusHandled,
}: FlowCanvasProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, setCenter } = useReactFlow();
  const [edgeEditor, setEdgeEditor] = useState<{
    id: string;
    value: string;
    suggestions: string[];
    x: number;
    y: number;
  } | null>(null);

  // Posicoes iniciais: usa as salvas; deriva layout pros nos sem posicao.
  const initialPositions = useMemo(() => {
    const hasAll = steps.every((s) => positions[s.id]);
    return hasAll && steps.length > 0 ? positions : layeredPositions(steps, edges);
    // init-only: o canvas remonta por fluxo (key) no pai.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState<RFNode>(
    toRFNodes(steps, initialPositions, onEditStep, onRemoveStep, onDuplicateStep, invalidStepIds),
  );
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState<Edge>(toRFEdges(edges));

  // Refs sempre com o estado mais recente, pra emitir DEPOIS do commit sem ler
  // estado dentro de updaters (o que dispararia setState-do-pai-durante-render).
  const nodesRef = useRef(rfNodes);
  const edgesRef = useRef(rfEdges);
  useEffect(() => {
    nodesRef.current = rfNodes;
  }, [rfNodes]);
  useEffect(() => {
    edgesRef.current = rfEdges;
  }, [rfEdges]);

  // Foco em um passo (ex.: vindo da validacao): centraliza e seleciona o no.
  useEffect(() => {
    if (!focusStepId) return;
    const node = nodesRef.current.find((n) => n.id === focusStepId);
    if (node) {
      setCenter(node.position.x + NODE_W / 2, node.position.y + NODE_H / 2, {
        zoom: 1.2,
        duration: 600,
      });
      setRfNodes((nodes) => nodes.map((n) => ({ ...n, selected: n.id === focusStepId })));
    }
    onFocusHandled?.();
  }, [focusStepId, setCenter, setRfNodes, onFocusHandled]);

  // Mantem o estado de erro (anel/icone) dos nos em sincronia com a validacao.
  // invalidStepIds deve ser memoizado no pai pra este efeito nao rodar a cada render.
  useEffect(() => {
    setRfNodes((nodes) =>
      nodes.map((n) => {
        const invalid = invalidStepIds?.has(n.id) ?? false;
        return n.data.invalid === invalid ? n : { ...n, data: { ...n.data, invalid } };
      }),
    );
  }, [invalidStepIds, setRfNodes]);

  // Emite o grafo normalizado pro pai. Deferido (setTimeout 0) pra rodar fora da
  // fase de render — assim os refs ja refletem o commit e nunca chamamos
  // onGraphChange (setState do pai) durante o render do canvas.
  const scheduleEmit = useCallback(
    (edgesOverride?: Edge[]) => {
      setTimeout(() => {
        const pos: NodePositions = {};
        for (const n of nodesRef.current) {
          pos[n.id] = { x: Math.round(n.position.x), y: Math.round(n.position.y) };
        }
        onGraphChange({
          edges: rfEdgesToModel(edgesOverride ?? edgesRef.current),
          positions: pos,
        });
      }, 0);
    },
    [onGraphChange],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      const sourceStep = steps.find((s) => s.id === connection.source);
      const existingFromSource = edgesRef.current.filter(
        (e) => e.source === connection.source,
      ).length;
      const branch = sourceStep
        ? defaultBranchFor(sourceStep.actionId, existingFromSource)
        : undefined;
      const next = addEdge(
        {
          ...connection,
          type: "smoothstep",
          label: branch,
          style: branch ? BRANCH_EDGE_STYLE : DEFAULT_EDGE_STYLE,
          labelStyle: EDGE_LABEL_STYLE,
          labelBgStyle: EDGE_LABEL_BG_STYLE,
          labelBgPadding: [6, 2] as [number, number],
          labelBgBorderRadius: 6,
        },
        edgesRef.current,
      );
      setRfEdges(next);
      scheduleEmit(next);
    },
    [steps, setRfEdges, scheduleEmit],
  );

  // Editar rotulo do ramo: clique na aresta abre um editor inline (sem window.prompt).
  const onEdgeClick = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      const sourceStep = steps.find((s) => s.id === edge.source);
      const rect = wrapperRef.current?.getBoundingClientRect();
      setEdgeEditor({
        id: edge.id,
        value: typeof edge.label === "string" ? edge.label : "",
        suggestions: sourceStep ? branchSuggestions(sourceStep.actionId) : [],
        x: rect ? event.clientX - rect.left : event.clientX,
        y: rect ? event.clientY - rect.top : event.clientY,
      });
    },
    [steps],
  );

  const commitEdgeLabel = useCallback(
    (id: string, label: string) => {
      const trimmed = label.trim();
      const updated = edgesRef.current.map((e) =>
        e.id === id
          ? {
              ...e,
              label: trimmed || undefined,
              style: trimmed ? BRANCH_EDGE_STYLE : DEFAULT_EDGE_STYLE,
            }
          : e,
      );
      setRfEdges(updated);
      scheduleEmit(updated);
      setEdgeEditor(null);
    },
    [setRfEdges, scheduleEmit],
  );

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const raw = event.dataTransfer.getData(DRAG_MIME);
      if (!raw) return;
      let payload: DragPayload;
      try {
        payload = JSON.parse(raw) as DragPayload;
      } catch {
        return;
      }
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      onDropAction(payload, { x: Math.round(position.x), y: Math.round(position.y) });
    },
    [screenToFlowPosition, onDropAction],
  );

  const autoLayout = useCallback(() => {
    const model = rfEdgesToModel(edgesRef.current);
    const pos = layeredPositions(steps, model);
    setRfNodes((nodes) => nodes.map((n) => ({ ...n, position: pos[n.id] ?? n.position })));
    scheduleEmit();
  }, [steps, setRfNodes, scheduleEmit]);

  return (
    <div ref={wrapperRef} className="relative h-full w-full">
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={NODE_TYPES}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={() => scheduleEmit()}
        onNodesDelete={() => scheduleEmit()}
        onEdgesDelete={() => scheduleEmit()}
        onEdgeClick={onEdgeClick}
        onPaneClick={() => setEdgeEditor(null)}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
        }}
        fitView
        proOptions={{ hideAttribution: true }}
        deleteKeyCode={["Backspace", "Delete"]}
        className="bg-slate-950"
      >
        <Background gap={24} size={1.5} color="#334155" />
        <Controls
          showInteractive={false}
          className="!rounded-lg !border !border-slate-700 !bg-slate-800 !shadow-lg [&_button]:!border-slate-700 [&_button]:!bg-slate-800 [&_button]:!fill-slate-300 [&_button:hover]:!bg-slate-700"
        />
        <MiniMap
          pannable
          zoomable
          className="!rounded-lg !border !border-slate-700 !bg-slate-900"
          nodeColor="#475569"
          maskColor="rgba(2, 6, 23, 0.7)"
        />
      </ReactFlow>

      <button
        type="button"
        onClick={autoLayout}
        className="absolute left-4 top-4 z-10 rounded-full border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 shadow-md transition-colors hover:border-sky-400 hover:text-sky-400"
      >
        Auto-organizar
      </button>

      {edgeEditor ? (
        <div
          className="absolute z-20 flex w-56 flex-col gap-2 rounded-lg border border-slate-600 bg-slate-800 p-3 shadow-xl"
          style={{
            left: Math.max(8, Math.min(edgeEditor.x, (wrapperRef.current?.clientWidth ?? 400) - 232)),
            top: Math.max(8, edgeEditor.y),
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-xs font-semibold text-slate-100">Rótulo do ramo</p>
          <input
            autoFocus
            value={edgeEditor.value}
            onChange={(e) =>
              setEdgeEditor((ed) => (ed ? { ...ed, value: e.target.value } : ed))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") commitEdgeLabel(edgeEditor.id, edgeEditor.value);
              else if (e.key === "Escape") setEdgeEditor(null);
            }}
            placeholder="Ex.: sim / não"
            className="h-8 w-full rounded-md border border-slate-600 bg-slate-900 px-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-sky-400"
          />
          {edgeEditor.suggestions.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {edgeEditor.suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => commitEdgeLabel(edgeEditor.id, s)}
                  className="rounded-full border border-slate-600 px-2 py-0.5 text-xs text-slate-300 transition-colors hover:border-sky-400 hover:text-sky-400"
                >
                  {s}
                </button>
              ))}
            </div>
          ) : null}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => commitEdgeLabel(edgeEditor.id, "")}
              className="text-xs text-slate-400 hover:text-slate-100"
            >
              Saída padrão
            </button>
            <button
              type="button"
              onClick={() => commitEdgeLabel(edgeEditor.id, edgeEditor.value)}
              className="rounded-md bg-sky-500 px-2.5 py-1 text-xs font-semibold text-white hover:bg-sky-400"
            >
              Salvar
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function FlowCanvas(props: FlowCanvasProps) {
  return (
    <ReactFlowProvider>
      <FlowCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
