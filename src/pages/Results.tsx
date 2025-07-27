import { useLocation, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import html2pdf from "html2pdf.js";
import { useRef } from "react";
import  LoadingScreen  from "../pages/LoadingScreen";

import { 
  Zap, TrendingUp, Target, Users, Globe, ArrowRight, 
  Download, Share2, BarChart3, Lightbulb, CheckCircle,
  AlertTriangle, Star, Award
} from "lucide-react";

type LogEntry = {
  timestamp: string;
  agent: string;
  message: string;
};

interface AnalysisData {
  brandName: string;
  industry: string;
  targetAudience: string;
  description: string;
  website: string;
  socialMedia: string;
  marketingGoals: string[];
}

const Results = () => {
  const location = useLocation();
  const [showResults, setShowResults] = useState(false);
  const analysisData = location.state?.analysisData as AnalysisData;
 // const [logs, setLogs] = useState<string[]>([]);
// const flowId = location.state?.flowId;
const [logs, setLogs] = useState<LogEntry[]>([]);

const [flowId, setFlowId] = useState<string | null>(null);
const token = localStorage.getItem("token"); // or sessionStorage, or from a context/provider



  // Mock Blynx Score and insights based on form data
  const blynxScore = Math.floor(Math.random() * 30) + 65; // 65-95 range
  const marketPresence = Math.floor(Math.random() * 25) + 70;
  const digitalFootprint = Math.floor(Math.random() * 20) + 75;
  const brandCoherence = Math.floor(Math.random() * 35) + 60;
  const audienceAlignment = Math.floor(Math.random() * 25) + 70;
const reportRef = useRef<HTMLDivElement>(null);

  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     setShowResults(true);
  //   }, 1000);
  //   return () => clearTimeout(timer);
  // }, []);
  
  useEffect(() => {
  // Prepare payload based on analysisData
  if (!analysisData) return;

  // const triggerAgent = async () => {
  //   try {
  //     const response = await fetch("https://blynx-backend.azurewebsites.net/api/v1/agents/trigger", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify(analysisData),
  //     });

  //     const result = await response.json();

  //     if (result.flow_id) {
  //       setFlowId(result.flow_id);
  //     } else {
  //       console.error("Flow ID not returned from trigger");
  //     }
  //   } catch (err) {
  //     console.error("Failed to trigger agent:", err);
  //   }
  // };

 const triggerAgent = async () => {
  try {
    const response = await fetch("https://blynx-backend.azurewebsites.net/api/v1/agents/trigger", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`, // ✅ add this line

      },
      body: JSON.stringify({}), // ✅ send empty body
    });

    const result = await response.json();

    if (response.ok && result.flow_id) {
      setFlowId(result.flow_id);
    } else {
      console.error("Flow ID not returned from trigger", result);
    }
  } catch (err) {
    console.error("Failed to trigger agent:", err);
  }
};


  triggerAgent();
  }, [analysisData]);

    useEffect(() => {
    if (!flowId) return;

    const ws = new WebSocket(`wss://blynx-backend.azurewebsites.net/api/v1/agents/logs/${flowId}`);

    ws.onopen = () => {
      console.log("WebSocket connected");
    };
    console.log("WebSocket URL:", flowId);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("WebSocket message received:", data);
      if (data.type === "logs") {
        setLogs((prev) => [...prev, data.data as LogEntry]);
        console.log("New log received:", data.data);

        //setLogs((prev) => [...prev, "Connecting to server..."]);

      } else if (data.type === "status" && data.data.final) {
        console.log("Flow completed");
          fetchResult(flowId); // new function
        setShowResults(true);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      console.log("WebSocket closed");
    };

    return () => ws.close();
  }, [flowId]);


  if (!showResults) {
    return <LoadingScreen logs={logs} />;
  }

  const fetchResult = async (id: string) => {
  try {
    const res = await fetch(`https://blynx-backend.azurewebsites.net/api/v1/agents/result/${id}`);
    const resultData = await res.json();
    console.log("Final Analysis Result:", resultData);

    // You can now use this data to replace mock scores/insights
    // e.g. setBlynxScore(resultData.score)
  } catch (err) {
    console.error("Error fetching final result:", err);
  }
};


  if (!analysisData) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Analysis Data Found</h2>
            <p className="text-muted-foreground mb-4">
              Please complete the brand analysis form first.
            </p>
            <Link to="/analyze">
              <Button variant="gradient">Start Analysis</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

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

  const scoreLevel = getScoreLevel(blynxScore);

  const handleExport = () => {
  if (reportRef.current) {
    const opt = {
      margin:       0.5,
      filename:     `${analysisData.brandName}_Blynx_Report.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(reportRef.current).save();
  }
};

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
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {!showResults ? (
          //Loading State
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8">
              <div className="animate-pulse">
                <div className="w-32 h-32 bg-gradient-primary rounded-full mx-auto mb-6 flex items-center justify-center">
                  <Zap className="w-16 h-16 text-white animate-bounce" />
                </div>
              </div>
              <h1 className="text-3xl font-bold mb-4">Analyzing {analysisData.brandName}...</h1>
              <p className="text-muted-foreground">
                Our AI is processing your brand across multiple dimensions
              </p>
            </div>
            <div className="max-w-md mx-auto space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm">Market positioning analysis</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm">Digital presence evaluation</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm">Audience alignment assessment</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Generating insights...</span>
              </div>
            </div>
          </div>
          
          
        ) : (
          // Results Display
          <div className="max-w-6xl mx-auto" ref={reportRef}>
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  {analysisData.brandName}
                </span>{" "}
                Analysis Complete
              </h1>
              <p className="text-xl text-muted-foreground">
                Here's your comprehensive brand presence report
              </p>
            </div>

            {/* Blynx Score Card */}
            <Card className="mb-8 shadow-brand border-2 border-primary/20">
              <CardContent className="p-8">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <scoreLevel.icon className={`w-8 h-8 ${getScoreColor(blynxScore)}`} />
                    <h2 className="text-2xl font-bold">Your Blynx Score</h2>
                  </div>
                  <div className={`text-6xl font-bold mb-2 ${getScoreColor(blynxScore)}`}>
                    {blynxScore}
                  </div>
                  <Badge variant="outline" className="text-lg px-4 py-1 mb-4">
                    {scoreLevel.level}
                  </Badge>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    {blynxScore >= 85 && "Outstanding! Your brand has excellent market presence and strong positioning."}
                    {blynxScore >= 70 && blynxScore < 85 && "Great job! Your brand shows strong potential with room for strategic improvements."}
                    {blynxScore >= 55 && blynxScore < 70 && "Good foundation! Focus on the recommendations below to enhance your brand presence."}
                    {blynxScore < 55 && "Significant opportunities ahead! Our insights will help transform your brand presence."}
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
                  <div className="text-3xl font-bold mb-2">{marketPresence}%</div>
                  <Progress value={marketPresence} className="mb-2" />
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
                  <div className="text-3xl font-bold mb-2">{digitalFootprint}%</div>
                  <Progress value={digitalFootprint} className="mb-2" />
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
                  <div className="text-3xl font-bold mb-2">{brandCoherence}%</div>
                  <Progress value={brandCoherence} className="mb-2" />
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
                  <div className="text-3xl font-bold mb-2">{audienceAlignment}%</div>
                  <Progress value={audienceAlignment} className="mb-2" />
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
                      <li>• Strong brand name recognition potential</li>
                      <li>• Clear industry positioning in {analysisData.industry}</li>
                      {analysisData.website && <li>• Professional web presence established</li>}
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                    <h4 className="font-semibold text-yellow-800 dark:text-yellow-400 mb-2">Opportunities</h4>
                    <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                      <li>• Enhance social media presence</li>
                      <li>• Strengthen brand storytelling</li>
                      <li>• Expand digital marketing reach</li>
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
                  <div className="border-l-4 border-primary pl-4">
                    <h4 className="font-semibold mb-1">Content Strategy</h4>
                    <p className="text-sm text-muted-foreground">
                      Develop consistent content themes that align with your brand values
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-accent pl-4">
                    <h4 className="font-semibold mb-1">Digital Optimization</h4>
                    <p className="text-sm text-muted-foreground">
                      Improve SEO and online visibility across key platforms
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-primary pl-4">
                    <h4 className="font-semibold mb-1">Audience Engagement</h4>
                    <p className="text-sm text-muted-foreground">
                      Create targeted campaigns for your {analysisData.targetAudience || "target audience"}
                    </p>
                  </div>
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
          </div>
        )}
      </div>
    </div>
  );
};

export default Results;