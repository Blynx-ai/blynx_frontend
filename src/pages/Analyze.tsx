import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Target, Users, Globe, ArrowRight, Loader2, Building } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";

const Analyze = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [business, setBusiness] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchBusiness();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const fetchBusiness = async () => {
    try {
      const response = await api.get('/api/v1/business/');
      setBusiness(response.data);
    } catch (error: any) {
      if (error.response?.status === 404) {
        // No business found, redirect to create one
        navigate('/business-profile');
        return;
      }
      toast.error("Failed to fetch business information");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!business && isAuthenticated) {
      navigate('/business-profile');
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const response = await api.post('/api/v1/agents/trigger', {});
      
      if (response.data.flow_id) {
        navigate('/results', { 
          state: { 
            flowId: response.data.flow_id,
            business: business
          } 
        });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to start analysis");
      setIsAnalyzing(false);
    }
  };

  const handleSkipAnalyze = () => {
    // For users without accounts, redirect to business profile creation
    navigate('/business-profile');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p>Loading...</p>
        </div>
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
            {isAuthenticated ? (
              <>
                <Link to="/business-profile">
                  <Button variant="outline" size="sm">
                    <Building className="w-4 h-4 mr-2" />
                    Business Profile
                  </Button>
                </Link>
                <span className="text-sm text-muted-foreground">
                  Welcome, {user?.username}
                </span>
              </>
            ) : (
              <Link to="/auth">
                <Button variant="outline" size="sm">
                  Login
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
              Analyze Your Brand
            </h1>
            <p className="text-xl text-muted-foreground mb-6">
              Get your personalized Blynx Score in minutes. Our AI analyzes your brand across multiple dimensions.
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <span>Market Positioning</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-accent" />
                <span>Audience Analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" />
                <span>Digital Presence</span>
              </div>
            </div>
          </div>

          {/* Business Information Card */}
          {business ? (
            <Card className="shadow-brand mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-primary" />
                  {business.name}
                </CardTitle>
                <CardDescription>
                  {business.industry_type} • {business.customer_type}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{business.about_us}</p>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  {business.landing_page_url && (
                    <div>
                      <span className="font-medium">Website:</span>
                      <a href={business.landing_page_url} target="_blank" rel="noopener noreferrer" 
                         className="text-primary hover:underline ml-2">
                        {business.landing_page_url}
                      </a>
                    </div>
                  )}
                  {business.instagram_url && (
                    <div>
                      <span className="font-medium">Instagram:</span>
                      <a href={business.instagram_url} target="_blank" rel="noopener noreferrer" 
                         className="text-primary hover:underline ml-2">
                        View Profile
                      </a>
                    </div>
                  )}
                  {business.linkedin_url && (
                    <div>
                      <span className="font-medium">LinkedIn:</span>
                      <a href={business.linkedin_url} target="_blank" rel="noopener noreferrer" 
                         className="text-primary hover:underline ml-2">
                        View Profile
                      </a>
                    </div>
                  )}
                  {business.x_url && (
                    <div>
                      <span className="font-medium">X (Twitter):</span>
                      <a href={business.x_url} target="_blank" rel="noopener noreferrer" 
                         className="text-primary hover:underline ml-2">
                        View Profile
                      </a>
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center mt-6">
                  <Link to="/business-profile">
                    <Button variant="outline">
                      Edit Business Info
                    </Button>
                  </Link>
                  <Button 
                    onClick={handleAnalyze} 
                    variant="gradient" 
                    size="lg"
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                        Starting Analysis...
                      </>
                    ) : (
                      <>
                        Analyze Brand
                        <ArrowRight className="ml-2 w-5 h-5" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-brand mb-8 border-accent/20 bg-accent/5">
              <CardContent className="p-8 text-center">
                <Building className="w-12 h-12 text-accent mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  {isAuthenticated ? "Complete Your Business Profile" : "Get Started"}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {isAuthenticated 
                    ? "Set up your business information to start the analysis"
                    : "Create a business profile or continue without an account"
                  }
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button onClick={handleSkipAnalyze} variant="gradient" size="lg">
                    {isAuthenticated ? "Setup Business Profile" : "Continue"}
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                  {!isAuthenticated && (
                    <Link to="/auth">
                      <Button variant="outline" size="lg">
                        Login / Register
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Info Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-accent/20 bg-accent/5">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Zap className="w-6 h-6 text-accent" />
                  <h3 className="font-semibold">AI-Powered Analysis</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Our advanced algorithms analyze your brand across 50+ data points to generate your unique Blynx Score.
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Target className="w-6 h-6 text-primary" />
                  <h3 className="font-semibold">Actionable Insights</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Get specific recommendations on how to improve your brand presence and market positioning.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analyze;