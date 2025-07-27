// src/hooks/useAgentLogs.ts
import { useEffect, useState } from "react";

export function useAgentLogs(flowId: string | null) {
  const [logs, setLogs] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!flowId) return;

    const ws = new WebSocket(`wss://b59482f06c9c.ngrok-free.app/api/v1/agents/logs/${flowId}`);

    ws.onopen = () => console.log("WebSocket connected");

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "logs") {
        setLogs((prev) => [...prev, data.data]);
      } else if (data.type === "status" && data.data.final) {
        console.log("Flow completed");
        setIsComplete(true);
      }
    };

    ws.onerror = (err) => console.error("WebSocket error", err);
    ws.onclose = () => console.log("WebSocket closed");

    return () => ws.close();
  }, [flowId]);

  return { logs, isComplete };
}
