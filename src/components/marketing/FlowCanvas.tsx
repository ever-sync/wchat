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

import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
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
import { AlertTriangle, X } from "lucide-react";
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
  const { step, onEdit, onRemove } = data;
  const Icon = ACTION_ICONS[step.iconKey];
  const noExecutor = !isExecutableMarketingFlowAction(step.actionId);
  const branching = isBranching(step.actionId);

  return (
    <div
      onClick={() => onEdit(step.id)}
      className={cn(
        "group relative flex w-60 cursor-pointer items-start gap-3 rounded-xl border bg-card px-4 py-3 shadow-sm transition-colors",
        selected ? "border-primary ring-2 ring-primary/30" : noExecutor ? "border-amber-500/60" : "border-border",
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !border-2 !border-primary !bg-background"
      />
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onRemove(step.id);
        }}
        aria-label={`Remover ${step.label}`}
        className="absolute -right-2 -top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground opacity-0 shadow-sm transition-opacity hover:text-destructive group-hover:opacity-100"
      >
        <X className="h-3.5 w-3.5" aria-hidden />
      </button>
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white",
          step.iconClass,
        )}
      >
        {Icon ? (
          <Icon className={cn("h-4 w-4", step.iconKey === "star" ? "fill-current" : "")} aria-hidden />
        ) : null}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-center gap-1.5 truncate text-sm font-semibold text-foreground">
          {step.label}
          {noExecutor ? (
            <AlertTriangle className="h-3 w-3 shrink-0 text-amber-500" aria-hidden />
          ) : null}
        </span>
        {noExecutor ? (
          <span className="truncate text-xs text-amber-600 dark:text-amber-400">
            Ainda não executável
          </span>
        ) : step.subtitle ? (
          <span className="truncate text-xs text-muted-foreground">{step.subtitle}</span>
        ) : (
          <span className="truncate text-xs text-muted-foreground">Clique para configurar</span>
        )}
      </div>

      {/* Saida unica; ramos sao distinguidos pelo rotulo da aresta. */}
      <Handle
        type="source"
        position={Position.Right}
        className={cn(
          "!h-3 !w-3 !border-2 !bg-background",
          branching ? "!border-amber-500" : "!border-primary",
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
  /** Emite o grafo normalizado sempre que arestas/posicoes mudam. */
  onGraphChange: (next: { edges: MarketingFlowEdge[]; positions: NodePositions }) => void;
  /** Soltar acao do painel: cria no na posicao do drop. */
  onDropAction: (payload: DragPayload, position: { x: number; y: number }) => void;
};

function toRFNodes(
  steps: CanvasStep[],
  positions: NodePositions,
  onEdit: (id: string) => void,
  onRemove: (id: string) => void,
): RFNode[] {
  return steps.map((step, i) => ({
    id: step.id,
    type: "step",
    position: positions[step.id] ?? { x: i * (NODE_W + GAP_X), y: 0 },
    data: { step, onEdit, onRemove },
  }));
}

function toRFEdges(edges: MarketingFlowEdge[]): Edge[] {
  return edges.map((e, i) => ({
    id: `e-${e.from}-${e.to}-${i}`,
    source: e.from,
    target: e.to,
    label: e.branch,
    type: "smoothstep",
    animated: false,
    labelStyle: { fontSize: 11, fontWeight: 600 },
    labelBgPadding: [6, 2] as [number, number],
    labelBgBorderRadius: 6,
  }));
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
  onGraphChange,
  onDropAction,
}: FlowCanvasProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  // Posicoes iniciais: usa as salvas; deriva layout pros nos sem posicao.
  const initialPositions = useMemo(() => {
    const hasAll = steps.every((s) => positions[s.id]);
    return hasAll && steps.length > 0 ? positions : layeredPositions(steps, edges);
    // init-only: o canvas remonta por fluxo (key) no pai.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState<RFNode>(
    toRFNodes(steps, initialPositions, onEditStep, onRemoveStep),
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
          labelStyle: { fontSize: 11, fontWeight: 600 },
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

  // Editar rotulo do ramo: clique duplo na aresta.
  const onEdgeDoubleClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      const current = typeof edge.label === "string" ? edge.label : "";
      const next = window.prompt("Rótulo do ramo (vazio = saída padrão):", current);
      if (next === null) return;
      const updated = edgesRef.current.map((e) =>
        e.id === edge.id ? { ...e, label: next.trim() || undefined } : e,
      );
      setRfEdges(updated);
      scheduleEmit(updated);
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
        onEdgeDoubleClick={onEdgeDoubleClick}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
        }}
        fitView
        proOptions={{ hideAttribution: true }}
        deleteKeyCode={["Backspace", "Delete"]}
        className="bg-muted/20"
      >
        <Background gap={20} className="text-border" />
        <Controls showInteractive={false} />
      </ReactFlow>

      <button
        type="button"
        onClick={autoLayout}
        className="absolute left-4 top-4 z-10 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm transition-colors hover:border-primary hover:text-primary"
      >
        Auto-organizar
      </button>
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
