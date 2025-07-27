import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap, ArrowRight, SkipForward } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      login(response.data.access_token, response.data.user);
      toast.success("Login successful!");
      
      // Check if user has a business profile
      try {
        await api.get('/api/v1/business/');
        navigate("/analyze");
      } catch {
        // No business profile, redirect to create one
        navigate("/business-profile");
      }
    } catch (error: any) {
      console.error("Login failed:", error?.response?.data || error.message);
      toast.error(error?.response?.data?.detail || "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.target as HTMLFormElement);
    const username = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      await api.post('/auth/register', {
        username,
        email,
        password,
      });
      
      toast.success("Account created successfully! Please login.");
      // Switch to login tab after successful signup
      document.querySelector('[value="login"]')?.click();
    } catch (error: any) {
      console.error("Signup failed:", error?.response?.data || error.message);
      toast.error(error?.response?.data?.detail || "Signup failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    navigate("/business-profile");
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6 group">
            <div className="p-2 bg-gradient-primary rounded-lg shadow-brand">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Blynx
            </span>
          </Link>
          <h1 className="text-2xl font-bold mb-2">Welcome to Blynx</h1>
          <p className="text-muted-foreground">
            Access your brand analysis dashboard
          </p>
        </div>

        {/* Skip Button */}
        <Card className="mb-6 border-2 border-dashed border-accent/30 bg-accent/5">
          <CardContent className="p-6 text-center">
            <SkipForward className="w-8 h-8 text-accent mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Try Without Account</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Experience Blynx instantly - no signup required
            </p>
            <Button 
              variant="accent" 
              className="w-full" 
              onClick={handleSkip}
            >
              Skip & Continue <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Auth Tabs */}
        <Card className="shadow-brand">
          <CardHeader className="text-center">
            <CardTitle>Continue with Account</CardTitle>
            <CardDescription>
              Save your analyses and track progress over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      name="email"
                      type="email" 
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input 
                      id="password" 
                      name="password"
                      type="password" 
                      placeholder="Enter your password"
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    variant="gradient"
                    disabled={isLoading}
                  >
                    {isLoading ? "Logging in..." : "Login"}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input 
                      id="name" 
                      name="name"
                      type="text" 
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-signup">Email</Label>
                    <Input 
                      id="email-signup" 
                      name="email"
                      type="email" 
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-signup">Password</Label>
                    <Input 
                      id="password-signup" 
                      name="password"
                      type="password" 
                      placeholder="Create a password"
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    variant="gradient"
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating Account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <Link 
            to="/" 
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Auth;