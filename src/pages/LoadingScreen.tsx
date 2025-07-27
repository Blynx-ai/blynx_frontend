import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoadingScreen({ logs }: { logs?: string[] }) {
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
            {logs.map((log, idx) => (
              <div key={idx}>{log}</div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
