import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Zap, Building, Globe, Users, Target, ArrowRight, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const Analyze = () => {
  const [formData, setFormData] = useState({
    brandName: "",
    industry: "",
    targetAudience: "",
    description: "",
    website: "",
    socialMedia: "",
    marketingGoals: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const industries = [
    "Technology", "Healthcare", "Finance", "E-commerce", "Fashion", 
    "Food & Beverage", "Education", "Real Estate", "Entertainment", "Other"
  ];

  const marketingGoals = [
    "Brand Awareness", "Lead Generation", "Customer Retention", 
    "Market Expansion", "Product Launch", "Thought Leadership"
  ];

  const handleGoalToggle = (goal: string) => {
    setFormData(prev => ({
      ...prev,
      marketingGoals: prev.marketingGoals.includes(goal)
        ? prev.marketingGoals.filter(g => g !== goal)
        : [...prev.marketingGoals, goal]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call to backend
    setTimeout(() => {
      // Navigate to results with the form data
      navigate("/results", { state: { analysisData: formData } });
    }, 3000);
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
            <Link to="/auth">
              <Button variant="outline" size="sm">
                Login
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
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

          {/* Analysis Form */}
          <Card className="shadow-brand">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5 text-primary" />
                Brand Information
              </CardTitle>
              <CardDescription>
                Tell us about your brand so our AI can provide accurate insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="brandName">Brand Name *</Label>
                    <Input
                      id="brandName"
                      placeholder="Enter your brand name"
                      value={formData.brandName}
                      onChange={(e) => setFormData(prev => ({ ...prev, brandName: e.target.value }))}
                      required
                      className="text-lg font-medium"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry *</Label>
                    <Select onValueChange={(value) => setFormData(prev => ({ ...prev, industry: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your industry" />
                      </SelectTrigger>
                      <SelectContent>
                        {industries.map(industry => (
                          <SelectItem key={industry} value={industry}>
                            {industry}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Brand Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your brand, products, or services..."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="website">Website URL</Label>
                    <Input
                      id="website"
                      placeholder="https://yourbrand.com"
                      value={formData.website}
                      onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="targetAudience">Target Audience</Label>
                    <Input
                      id="targetAudience"
                      placeholder="e.g., Young professionals, Tech startups"
                      value={formData.targetAudience}
                      onChange={(e) => setFormData(prev => ({ ...prev, targetAudience: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="socialMedia">Social Media Handles</Label>
                  <Input
                    id="socialMedia"
                    placeholder="@yourbrand, linkedin.com/company/yourbrand"
                    value={formData.socialMedia}
                    onChange={(e) => setFormData(prev => ({ ...prev, socialMedia: e.target.value }))}
                  />
                </div>

                <div className="space-y-3">
                  <Label>Marketing Goals (Optional)</Label>
                  <div className="flex flex-wrap gap-2">
                    {marketingGoals.map(goal => (
                      <Badge
                        key={goal}
                        variant={formData.marketingGoals.includes(goal) ? "default" : "outline"}
                        className="cursor-pointer hover:scale-105 transition-all"
                        onClick={() => handleGoalToggle(goal)}
                      >
                        {goal}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="pt-6">
                  <Button 
                    type="submit" 
                    variant="gradient" 
                    size="lg" 
                    className="w-full text-lg py-6"
                    disabled={isLoading || !formData.brandName || !formData.industry || !formData.description}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                        Analyzing Your Brand...
                      </>
                    ) : (
                      <>
                        Get My Blynx Score
                        <ArrowRight className="ml-2 w-5 h-5" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Info Cards */}
          <div className="grid md:grid-cols-2 gap-6 mt-12">
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