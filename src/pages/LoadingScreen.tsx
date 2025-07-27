import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { 
  Activity, CheckCircle, Clock, Loader2, Zap, Target, 
  Users, Globe, Building, TrendingUp, AlertCircle
} from "lucide-react";

type LogEntry = {
  timestamp: string;
  agent: string;
  message: string;
  metadata?: {
    type?: string;
    [key: string]: any;
  };
};

interface LoadingScreenProps {
  logs: LogEntry[];
  business?: any;
  isConnecting?: boolean;
}

const getAgentIcon = (agent: string) => {
  switch (agent.toLowerCase()) {
    case 'system':
      return <Activity className="w-4 h-4" />;
    case 'ingestor':
    case 'instagram_scraper':
    case 'linkedin_scraper':
    case 'x_scraper':
      return <CheckCircle className="w-4 h-4" />;
    case 'analyzer':
    case 'content':
    case 'data':
    case 'classifier':
    case 'extractor':
      return <Activity className="w-4 h-4" />;
    case 'scorer':
      return <Target className="w-4 h-4" />;
    case 'feedback':
      return <TrendingUp className="w-4 h-4" />;
    case 'news':
    case 'news_analyzer':
      return <Globe className="w-4 h-4" />;
    case 'accuracy':
    case 'impact':
    case 'language':
    case 'brand':
    case 'reputation':
      return <CheckCircle className="w-4 h-4" />;
    default:
      return <Clock className="w-4 h-4" />;
  }
};

const getAgentColor = (agent: string) => {
  switch (agent.toLowerCase()) {
    case 'system':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'ingestor':
    case 'instagram_scraper':
    case 'linkedin_scraper':
    case 'x_scraper':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'analyzer':
    case 'content':
    case 'data':
    case 'classifier':
    case 'extractor':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'scorer':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'feedback':
      return 'bg-cyan-100 text-cyan-800 border-cyan-200';
    case 'news':
    case 'news_analyzer':
      return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    case 'accuracy':
    case 'impact':
    case 'language':
    case 'brand':
    case 'reputation':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const formatTimestamp = (timestamp: string) => {
  try {
    return new Date(timestamp).toLocaleTimeString();
  } catch {
    return timestamp;
  }
};

const getProgressPercentage = (logs: LogEntry[]) => {
  const totalSteps = 15; // Approximate number of major steps
  const completedSteps = logs.length;
  return Math.min((completedSteps / totalSteps) * 100, 95); // Cap at 95% until completion
};

export default function LoadingScreen({ logs = [], business, isConnecting = false }: LoadingScreenProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new logs arrive
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [logs]);

  const latestLog = logs[logs.length - 1];
  const progress = getProgressPercentage(logs);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center shadow-brand">
                  <Loader2 className="w-10 h-10 text-white animate-spin" />
                </div>
                {isConnecting ? (
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                    <Clock className="w-3 h-3 text-white" />
                  </div>
                ) : (
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <Activity className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Analyzing {business?.name || 'Your Brand'}...
            </h1>
            
            <p className="text-lg text-muted-foreground mb-4">
              Our AI agents are processing your brand across multiple dimensions
            </p>
            
            {/* Progress Bar */}
            <div className="max-w-md mx-auto mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            
            {latestLog && (
              <div className="inline-flex items-center gap-2 bg-background rounded-full px-4 py-2 shadow-sm">
                {getAgentIcon(latestLog.agent)}
                <span className="text-sm font-medium">{latestLog.message}</span>
              </div>
            )}

            {isConnecting && (
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="w-4 h-4" />
                <span>Establishing connection...</span>
              </div>
            )}
          </div>

          {/* Progress Overview */}
          <Card className="mb-6 shadow-brand">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Analysis Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {logs.filter(log => 
                      log.agent.toLowerCase().includes('scraper') || 
                      log.agent.toLowerCase() === 'ingestor' ||
                      log.message.toLowerCase().includes('successfully scraped')
                    ).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Data Sources</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {logs.filter(log => 
                      log.agent.toLowerCase().includes('analyzer') || 
                      log.agent.toLowerCase().includes('classifier') ||
                      log.agent.toLowerCase().includes('extractor')
                    ).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Analyzed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-1">
                    {logs.filter(log => 
                      log.agent.toLowerCase().includes('evaluator') || 
                      log.agent.toLowerCase().includes('accuracy') ||
                      log.agent.toLowerCase().includes('impact') ||
                      log.agent.toLowerCase().includes('language') ||
                      log.agent.toLowerCase().includes('brand') ||
                      log.agent.toLowerCase().includes('reputation')
                    ).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Evaluated</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600 mb-1">
                    {logs.filter(log => 
                      log.agent.toLowerCase().includes('scorer') ||
                      log.agent.toLowerCase().includes('feedback')
                    ).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Scoring</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Live Logs */}
          {logs.length > 0 && (
            <Card className="shadow-brand">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-accent" />
                  Live Agent Activity
                  <Badge variant="outline" className="ml-auto">
                    {logs.length} events
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-80 w-full rounded-md border p-4" ref={scrollAreaRef}>
                  <div className="space-y-3">
                    {logs.map((log, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                        <div className="flex-shrink-0">
                          {getAgentIcon(log.agent)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getAgentColor(log.agent)}`}
                            >
                              {log.agent.toUpperCase()}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatTimestamp(log.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed">{log.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* What's Happening */}
          <Card className="mt-6 border-primary/20 bg-primary/5">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary" />
                What's Happening Now
              </h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span>Collecting data from your business URLs</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  <span>Analyzing content and brand messaging</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                  <span>Evaluating market positioning and accuracy</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                  <span>Computing Blynx Score and generating insights</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
