import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type LogEntry = {
  timestamp: string;
  agent: string;
  message: string;
  metadata?: {
    type?: string;
    [key: string]: any;
  };
};


export default function LoadingScreen({ logs }: { logs?: LogEntry[] }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 text-center p-4">
      <Loader2 className="animate-spin w-12 h-12 text-primary" />
      <h1 className="text-2xl font-semibold">Analyzing Website...</h1>
      <p className="text-muted-foreground">
        Please wait while the agent scrapes the website and analyzes the content.
      </p>

      {logs && logs.length > 0 && (
        <Card className="w-full max-w-3xl mt-4">
          <CardHeader>
            <CardTitle className="text-left">Live Agent Logs</CardTitle>
          </CardHeader>
          <CardContent className="h-64 overflow-auto font-mono text-sm whitespace-pre-wrap bg-muted rounded p-4 text-left">
            
            {/* {logs.map((log, index) => (
  <div key={index} style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>
    <div><strong>{log.timestamp}</strong> - <strong>{log.agent}</strong></div>
    <div>{log.message}</div>
  </div>
))} */}
{logs.map((log, index) => (
  <div key={index} className="py-2 border-b border-gray-300">
    <div className="font-bold text-sm">{log.timestamp} - {log.agent}</div>
    <div>{log.message}</div>
  </div>
))}

          </CardContent>
        </Card>
      )}
    </div>
  );
}
