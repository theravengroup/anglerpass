/** Shared prop shape for all node-type property panels. */
export interface NodeConfigProps {
  config: Record<string, unknown>;
  onUpdate: (config: Record<string, unknown>) => void;
}
