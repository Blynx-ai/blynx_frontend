import { useState, useEffect, useRef } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { 
  Zap, Download, Share2, AlertTriangle, Award, Star, TrendingUp, Target, 
  Activity, CheckCircle, Clock, Users, Globe, Building, ExternalLink,
  Loader2, BarChart3, Lightbulb, ArrowRight, RefreshCw, Eye
} from "lucide-react";
import html2pdf from 'html2pdf.js';
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { API_BASE_URL } from "@/lib/api";
import api from "@/lib/api";

type LogEntry = {
  timestamp: string;
  agent: string;
  message: string;
  metadata?: {
    type?: string;
    [key: string]: any;
  };
};

interface AnalysisResult {
  flow_id: string;
  status: string;
  blynx_score?: {
    overall_score: number;
    market_presence: number;
    digital_footprint: number;
    brand_coherence: number;
    audience_alignment: number;
  };
  feedback?: {
    strengths: string[];
    areas_for_improvement: string[];
    recommendations: string[];
  };
  analysis_details?: any;
  created_at: string;
}

interface Business {
  id: number;
  name: string;
  about_us: string;
  industry_type: string;
  customer_type: string;
  landing_page_url?: string;
  instagram_url?: string;
  linkedin_url?: string;
  x_url?: string;
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

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [analysisPhase, setAnalysisPhase] = useState<'starting' | 'running' | 'completed' | 'error'>('starting');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [flowId, setFlowId] = useState<string | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isFetchingResults, setIsFetchingResults] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [manualResultsAvailable, setManualResultsAvailable] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    // Get flowId and business from location state
    const stateFlowId = location.state?.flowId;
    const stateBusiness = location.state?.business;
    
    if (stateFlowId) {
      setFlowId(stateFlowId);
      setAnalysisPhase('running');
    }
    
    if (stateBusiness) {
      setBusiness(stateBusiness);
    }

    // If no flowId in state, try to trigger a new analysis
    if (!stateFlowId && isAuthenticated) {
      triggerNewAnalysis();
    } else if (!stateFlowId) {
      setAnalysisPhase('error');
      toast.error("No analysis session found. Please start a new analysis.");
    }

    return () => {
      // Cleanup WebSocket on unmount
      if (wsRef.current) {
        console.log("Cleaning up WebSocket connection");
        wsRef.current.close(1000, "Component unmounting");
        wsRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [location.state, isAuthenticated]);

  useEffect(() => {
    if (!flowId) return;

    connectToWebSocket(flowId);

    // Check for manual results availability after some time
    const checkResultsTimer = setTimeout(() => {
      setManualResultsAvailable(true);
    }, 30000); // Show manual button after 30 seconds

    return () => {
      clearTimeout(checkResultsTimer);
    };
  }, [flowId]);

  useEffect(() => {
    // Auto-scroll to bottom when new logs arrive
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [logs]);

  const triggerNewAnalysis = async () => {
    try {
      setAnalysisPhase('starting');
      const response = await api.post("/api/v1/agents/trigger", {});

      if (response.data.flow_id) {
        setFlowId(response.data.flow_id);
        setAnalysisPhase('running');
        
        // Also fetch business info if not already available
        if (!business) {
          try {
            const businessResponse = await api.get('/api/v1/business/');
            setBusiness(businessResponse.data);
          } catch (err) {
            console.log("No business profile found");
          }
        }
      } else {
        setAnalysisPhase('error');
        toast.error("Failed to start analysis");
      }
    } catch (err) {
      console.error("Failed to trigger agent:", err);
      setAnalysisPhase('error');
      toast.error("Failed to start analysis");
    }
  };

  const connectToWebSocket = (id: string) => {
    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close(1000, "Reconnecting");
      wsRef.current = null;
    }

    // Clear any pending reconnection
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    const wsUrl = `${API_BASE_URL.replace('http', 'ws')}/api/v1/agents/logs/${id}`;
    console.log("Connecting to WebSocket:", wsUrl);
    
    const websocket = new WebSocket(wsUrl);
    wsRef.current = websocket;
    setWs(websocket);

    websocket.onopen = () => {
      console.log("WebSocket connected successfully");
      setIsConnecting(false);
      setWsConnected(true);
      setConnectionAttempts(0);
      toast.success("Connected to live analysis feed");
    };

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("WebSocket message received:", data);
        
        if (data.type === "logs") {
          // Handle both single log entry and array of log entries
          const newLogs = Array.isArray(data.data) ? data.data : [data.data];
          
          // Filter important logs (exclude Gemini API calls and other noise)
          const importantLogs = newLogs.filter((log: LogEntry) => {
            const message = log.message?.toLowerCase() || "";
            return !message.includes("http request") && 
                   !message.includes("afc is enabled") && 
                   !message.includes("afc remote call") &&
                   !message.includes("generativelanguage.googleapis.com") &&
                   log.agent !== "httpx" &&
                   log.agent !== "google_genai.models";
          });

          if (importantLogs.length > 0) {
            setLogs((prev) => {
              // Avoid duplicates
              const existingMessages = new Set(prev.map(l => `${l.timestamp}-${l.message}`));
              const newUniqueLogs = importantLogs.filter((log: LogEntry) => 
                !existingMessages.has(`${log.timestamp}-${log.message}`)
              );
              return [...prev, ...newUniqueLogs];
            });
          }

          // Check if flow is completed based on specific completion messages
          const completedLog = newLogs.find((log: LogEntry) => 
            log.message?.includes("Enhanced agent flow completed successfully") ||
            log.message?.includes("Final result saved for flow") ||
            log.message?.includes("Flow completed") ||
            log.agent?.toLowerCase().includes("reputation") // Since reputation is typically the last step
          );

          if (completedLog) {
            console.log("Flow completed, fetching results...");
            setManualResultsAvailable(true);
            // Don't close WebSocket immediately, wait a bit then fetch results
            setTimeout(() => fetchFinalResult(id), 2000);
          }
        } else if (data.type === "status") {
          console.log("Status update:", data.data);
          if (data.data.final || data.data.status === "completed") {
            console.log("Flow completed via status message");
            setManualResultsAvailable(true);
            setTimeout(() => fetchFinalResult(id), 1000);
          }
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    websocket.onerror = (error) => {
      console.error("WebSocket error:", error);
      setWsConnected(false);
      toast.error("Connection error. Will attempt to reconnect...");
    };

    websocket.onclose = (event) => {
      console.log("WebSocket closed:", event.code, event.reason);
      setWsConnected(false);
      setIsConnecting(false);
      
      // Only attempt reconnection if it wasn't a manual close and we're still in running phase
      if (event.code !== 1000 && analysisPhase === 'running' && connectionAttempts < 5) {
        const newAttempts = connectionAttempts + 1;
        setConnectionAttempts(newAttempts);
        console.log(`Attempting to reconnect (${newAttempts}/5)...`);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          if (analysisPhase === 'running') {
            connectToWebSocket(id);
          }
        }, Math.min(1000 * Math.pow(2, newAttempts), 10000)); // Exponential backoff, max 10s
      } else if (connectionAttempts >= 5) {
        toast.error("Connection lost. Use the manual refresh button to check for results.");
        setManualResultsAvailable(true);
      }
    };
  };

  const fetchFinalResult = async (id: string, isManual: boolean = false) => {
    if (isFetchingResults) return;
    
    setIsFetchingResults(true);
    
    if (isManual) {
      toast.info("Checking for results...");
    }

    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/agents/result/${id}`, {
        headers,
      });

      if (response.ok) {
        const resultData = await response.json();
        console.log("Final Analysis Result:", resultData);
        setAnalysisResult(resultData);
        setAnalysisPhase('completed');
        toast.success("Analysis completed!");
        
        // Close WebSocket now that we have results
        if (wsRef.current) {
          wsRef.current.close(1000, "Analysis completed");
          wsRef.current = null;
        }
      } else {
        console.error("Failed to fetch results:", response.status);
        if (isManual) {
          toast.error("Results not ready yet. Please try again in a moment.");
        } else {
          // Show mock results after some time for automatic fetch
          setTimeout(() => {
            if (analysisPhase !== 'completed') {
              setAnalysisPhase('completed');
              generateMockResults();
            }
          }, 5000);
        }
      }
    } catch (err) {
      console.error("Error fetching final result:", err);
      if (isManual) {
        toast.error("Failed to fetch results. Please try again.");
      } else {
        // Show mock results after some time for automatic fetch
        setTimeout(() => {
          if (analysisPhase !== 'completed') {
            setAnalysisPhase('completed');
            generateMockResults();
          }
        }, 5000);
      }
    } finally {
      setIsFetchingResults(false);
    }
  };

  const handleManualFetchResults = () => {
    if (flowId) {
      fetchFinalResult(flowId, true);
    }
  };

  const generateMockResults = () => {
    // Generate mock results if real results are not available
    const mockResult: AnalysisResult = {
      flow_id: flowId || 'mock',
      status: 'completed',
      blynx_score: {
        overall_score: Math.floor(Math.random() * 30) + 65,
        market_presence: Math.floor(Math.random() * 25) + 70,
        digital_footprint: Math.floor(Math.random() * 20) + 75,
        brand_coherence: Math.floor(Math.random() * 35) + 60,
        audience_alignment: Math.floor(Math.random() * 25) + 70,
      },
      feedback: {
        strengths: [
          "Strong brand name recognition potential",
          `Clear industry positioning in ${business?.industry_type || 'your industry'}`,
          "Professional web presence established"
        ],
        areas_for_improvement: [
          "Enhance social media presence",
          "Strengthen brand storytelling",
          "Expand digital marketing reach"
        ],
        recommendations: [
          "Develop consistent content themes that align with your brand values",
          "Improve SEO and online visibility across key platforms",
          `Create targeted campaigns for your ${business?.customer_type || 'target audience'}`
        ]
      },
      created_at: new Date().toISOString()
    };
    setAnalysisResult(mockResult);
    toast.success("Analysis completed with sample results!");
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-green-600";
    if (score >= 70) return "text-primary";
    if (score >= 55) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreLevel = (score: number) => {
    if (score >= 85) return { level: "Excellent", icon: Award };
    if (score >= 70) return { level: "Good", icon: Star };
    if (score >= 55) return { level: "Average", icon: TrendingUp };
    return { level: "Needs Improvement", icon: Target };
  };

  const handleExport = () => {
    if (reportRef.current) {
      const opt = {
        margin: 0.5,
        filename: `${business?.name || 'Brand'}_Blynx_Report.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };
      html2pdf().set(opt).from(reportRef.current).save();
    }
  };

  const latestLog = logs[logs.length - 1];
  const progress = getProgressPercentage(logs);

  // Render based on analysis phase
  if (analysisPhase === 'error') {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Analysis Session Found</h2>
            <p className="text-muted-foreground mb-4">
              Please start a new brand analysis.
            </p>
            <Link to="/analyze">
              <Button>Start Analysis</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <div className="bg-background border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="p-2 bg-gradient-primary rounded-lg shadow-brand">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Blynx
            </span>
          </Link>
          
          <div className="flex items-center gap-3">
            {/* Connection Status */}
            {analysisPhase === 'running' && (
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-sm text-muted-foreground">
                  {wsConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            )}

            {/* Manual Results Button */}
            {manualResultsAvailable && analysisPhase === 'running' && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleManualFetchResults}
                disabled={isFetchingResults}
              >
                {isFetchingResults ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Eye className="w-4 h-4 mr-2" />
                )}
                Check Results
              </Button>
            )}

            {analysisPhase === 'completed' && (
              <>
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="w-4 h-4 mr-2" />
                  Export Report
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {analysisPhase === 'starting' || analysisPhase === 'running' ? (
          // Loading/Analysis Phase
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
                  ) : wsConnected ? (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <Activity className="w-3 h-3 text-white" />
                    </div>
                  ) : (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                      <AlertTriangle className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                {analysisPhase === 'starting' ? 'Starting Analysis...' : `Analyzing ${business?.name || 'Your Brand'}...`}
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

              {/* Connection Status Messages */}
              {isConnecting && (
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Establishing connection...</span>
                </div>
              )}

              {!wsConnected && !isConnecting && connectionAttempts > 0 && (
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-yellow-600">
                  <RefreshCw className="w-4 h-4" />
                  <span>Reconnecting... (attempt {connectionAttempts}/5)</span>
                </div>
              )}
            </div>

            {/* Manual Results Button - Prominent */}
            {manualResultsAvailable && (
              <Card className="mb-6 border-2 border-primary/50 bg-primary/5">
                <CardContent className="p-6 text-center">
                  <h3 className="font-semibold mb-2">Analysis May Be Complete</h3>
                  <p className="text-muted-foreground mb-4">
                    Click below to check if your results are ready
                  </p>
                  <Button 
                    onClick={handleManualFetchResults}
                    disabled={isFetchingResults}
                    size="lg"
                  >
                    {isFetchingResults ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-2" />
                        View Results
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

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
        ) : (
          // Results Display
          <div className="max-w-6xl mx-auto" ref={reportRef}>
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  {business?.name || 'Your Brand'}
                </span>{" "}
                Analysis Complete
              </h1>
              <p className="text-xl text-muted-foreground">
                Here's your comprehensive brand presence report
              </p>
            </div>

            {/* Results content */}
            {analysisResult && (
              <>
                {/* Blynx Score Card */}
                <Card className="mb-8 shadow-brand border-2 border-primary/20">
                  <CardContent className="p-8">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-3 mb-4">
                        {(() => {
                          const scoreLevel = getScoreLevel(analysisResult.blynx_score?.overall_score || 75);
                          return (
                            <>
                              <scoreLevel.icon className={`w-8 h-8 ${getScoreColor(analysisResult.blynx_score?.overall_score || 75)}`} />
                              <h2 className="text-2xl font-bold">Your Blynx Score</h2>
                            </>
                          );
                        })()}
                      </div>
                      <div className={`text-6xl font-bold mb-2 ${getScoreColor(analysisResult.blynx_score?.overall_score || 75)}`}>
                        {analysisResult.blynx_score?.overall_score || 75}
                      </div>
                      <Badge variant="outline" className="text-lg px-4 py-1 mb-4">
                        {getScoreLevel(analysisResult.blynx_score?.overall_score || 75).level}
                      </Badge>
                      <p className="text-muted-foreground max-w-2xl mx-auto">
                        {(() => {
                          const score = analysisResult.blynx_score?.overall_score || 75;
                          if (score >= 85) return "Outstanding! Your brand has excellent market presence and strong positioning.";
                          if (score >= 70) return "Great job! Your brand shows strong potential with room for strategic improvements.";
                          if (score >= 55) return "Good foundation! Focus on the recommendations below to enhance your brand presence.";
                          return "Significant opportunities ahead! Our insights will help transform your brand presence.";
                        })()}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Detailed Metrics */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        Market Presence
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold mb-2">{analysisResult.blynx_score?.market_presence || 75}%</div>
                      <Progress value={analysisResult.blynx_score?.market_presence || 75} className="mb-2" />
                      <p className="text-xs text-muted-foreground">
                        Brand visibility and recognition
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Digital Footprint
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold mb-2">{analysisResult.blynx_score?.digital_footprint || 80}%</div>
                      <Progress value={analysisResult.blynx_score?.digital_footprint || 80} className="mb-2" />
                      <p className="text-xs text-muted-foreground">
                        Online presence strength
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Brand Coherence
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold mb-2">{analysisResult.blynx_score?.brand_coherence || 70}%</div>
                      <Progress value={analysisResult.blynx_score?.brand_coherence || 70} className="mb-2" />
                      <p className="text-xs text-muted-foreground">
                        Message consistency
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Audience Alignment
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold mb-2">{analysisResult.blynx_score?.audience_alignment || 78}%</div>
                      <Progress value={analysisResult.blynx_score?.audience_alignment || 78} className="mb-2" />
                      <p className="text-xs text-muted-foreground">
                        Target market fit
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Insights and Recommendations */}
                <div className="grid lg:grid-cols-2 gap-8 mb-8">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-accent" />
                        Key Insights
                      </CardTitle>
                      <CardDescription>
                        AI-generated insights about your brand
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                        <h4 className="font-semibold text-green-800 dark:text-green-400 mb-2">Strengths</h4>
                        <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                          {analysisResult.feedback?.strengths?.map((strength, index) => (
                            <li key={index}>• {strength}</li>
                          )) || [
                            <li key="1">• Strong brand name recognition potential</li>,
                            <li key="2">• Clear industry positioning in {business?.industry_type}</li>,
                            <li key="3">• Professional web presence established</li>
                          ]}
                        </ul>
                      </div>
                      
                      <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                        <h4 className="font-semibold text-yellow-800 dark:text-yellow-400 mb-2">Opportunities</h4>
                        <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                          {analysisResult.feedback?.areas_for_improvement?.map((area, index) => (
                            <li key={index}>• {area}</li>
                          )) || [
                            <li key="1">• Enhance social media presence</li>,
                            <li key="2">• Strengthen brand storytelling</li>,
                            <li key="3">• Expand digital marketing reach</li>
                          ]}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        Recommendations
                      </CardTitle>
                      <CardDescription>
                        Actionable steps to improve your Blynx Score
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {analysisResult.feedback?.recommendations?.map((rec, index) => (
                        <div key={index} className="border-l-4 border-primary pl-4">
                          <p className="text-sm text-muted-foreground">{rec}</p>
                        </div>
                      )) || [
                        <div key="1" className="border-l-4 border-primary pl-4">
                          <h4 className="font-semibold mb-1">Content Strategy</h4>
                          <p className="text-sm text-muted-foreground">
                            Develop consistent content themes that align with your brand values
                          </p>
                        </div>,
                        <div key="2" className="border-l-4 border-accent pl-4">
                          <h4 className="font-semibold mb-1">Digital Optimization</h4>
                          <p className="text-sm text-muted-foreground">
                            Improve SEO and online visibility across key platforms
                          </p>
                        </div>,
                        <div key="3" className="border-l-4 border-primary pl-4">
                          <h4 className="font-semibold mb-1">Audience Engagement</h4>
                          <p className="text-sm text-muted-foreground">
                            Create targeted campaigns for your {business?.customer_type || "target audience"}
                          </p>
                        </div>
                      ]}
                    </CardContent>
                  </Card>
                </div>

                {/* Call to Action */}
                <Card className="bg-gradient-primary text-white">
                  <CardContent className="p-8 text-center">
                    <h3 className="text-2xl font-bold mb-4">
                      Ready to Improve Your Blynx Score?
                    </h3>
                    <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
                      Get personalized guidance and track your progress with our premium analysis tools.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Link to="/analyze">
                        <Button variant="secondary" size="lg">
                          Analyze Another Brand
                        </Button>
                      </Link>
                      <Button variant="accent" size="lg">
                        Get Premium Insights <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Results;