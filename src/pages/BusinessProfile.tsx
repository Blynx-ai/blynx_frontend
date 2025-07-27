import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Building, Zap, Save, Edit, Trash, Link as LinkIcon, AlertCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { isValidUrl, formatUrl } from "@/lib/utils";
import { toast } from "sonner";

interface Business {
  id: number;
  user_id: number;
  name: string;
  about_us: string | null;
  industry_type: string | null;
  customer_type: string | null;
  landing_page_url: string | null;
  instagram_url: string | null;
  linkedin_url: string | null;
  x_url: string | null;
  created_at: string;
  updated_at: string;
}

const BusinessProfile = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [business, setBusiness] = useState<Business | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    about_us: "",
    industry_type: "",
    customer_type: "",
    landing_page_url: "",
    instagram_url: "",
    linkedin_url: "",
    x_url: "",
  });
  const [urlErrors, setUrlErrors] = useState<Record<string, string>>({});

  const industries = [
    "Technology", "Healthcare", "Finance", "E-commerce", "Fashion", 
    "Food & Beverage", "Education", "Real Estate", "Entertainment", "Other"
  ];

  const audiences = ["B2B", "B2C", "Other"];

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    fetchBusiness();
  }, [isAuthenticated, navigate]);

  const fetchBusiness = async () => {
    try {
      const response = await api.get('/api/v1/business/');
      setBusiness(response.data);
      setFormData({
        name: response.data.name || "",
        about_us: response.data.about_us || "",
        industry_type: response.data.industry_type || "",
        customer_type: response.data.customer_type || "",
        landing_page_url: response.data.landing_page_url || "",
        instagram_url: response.data.instagram_url || "",
        linkedin_url: response.data.linkedin_url || "",
        x_url: response.data.x_url || "",
      });
      setIsEditing(false);
    } catch (error: any) {
      console.error('Fetch business error:', error.response?.data);
      if (error.response?.status === 404) {
        // Use hardcoded business values when no business found
        const hardcodedBusiness = {
          id: 0,
          user_id: 0,
          name: "Dualite",
          about_us: "Vibe coding company specializing in innovative web development and digital solutions",
          industry_type: "Technology",
          customer_type: "coders , developers , managers",
          landing_page_url: "https://dualite.dev/",
          instagram_url: "https://dualite.dev/",
          linkedin_url: "https://dualite.dev/",
          x_url: "https://dualite.dev/",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        setBusiness(hardcodedBusiness);
        setFormData({
          name: hardcodedBusiness.name,
          about_us: hardcodedBusiness.about_us,
          industry_type: hardcodedBusiness.industry_type,
          customer_type: hardcodedBusiness.customer_type,
          landing_page_url: hardcodedBusiness.landing_page_url,
          instagram_url: hardcodedBusiness.instagram_url,
          linkedin_url: hardcodedBusiness.linkedin_url,
          x_url: hardcodedBusiness.x_url,
        });
        setIsEditing(false);
      } else {
        toast.error("Failed to fetch business information");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const validateUrls = () => {
    const errors: Record<string, string> = {};
    const urlFields = ['landing_page_url', 'instagram_url', 'linkedin_url', 'x_url'];
    
    urlFields.forEach(field => {
      const value = formData[field as keyof typeof formData];
      if (value && !isValidUrl(formatUrl(value))) {
        errors[field] = 'Please enter a valid URL';
      }
    });
    
    setUrlErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateUrls()) {
      toast.error("Please fix URL errors before saving");
      return;
    }

    if (!formData.name.trim()) {
      toast.error("Business name is required");
      return;
    }

    setIsSaving(true);
    try {
      // Format URLs and filter out empty strings
      const formattedData = {
        name: formData.name.trim(),
        about_us: formData.about_us?.trim() || null,
        industry_type: formData.industry_type || null,
        customer_type: formData.customer_type || null,
        landing_page_url: formData.landing_page_url?.trim() ? formatUrl(formData.landing_page_url.trim()) : null,
        instagram_url: formData.instagram_url?.trim() ? formatUrl(formData.instagram_url.trim()) : null,
        linkedin_url: formData.linkedin_url?.trim() ? formatUrl(formData.linkedin_url.trim()) : null,
        x_url: formData.x_url?.trim() ? formatUrl(formData.x_url.trim()) : null,
      };

      console.log('Sending business data:', formattedData);

      if (business) {
        // Update existing business
        const response = await api.put('/api/v1/business/', formattedData);
        setBusiness(response.data);
        toast.success("Business updated successfully");
      } else {
        // Create new business
        const response = await api.post('/api/v1/business/', formattedData);
        setBusiness(response.data);
        toast.success("Business created successfully");
      }
      setIsEditing(false);
    } catch (error: any) {
      console.error('Save business error:', error.response?.data);
      toast.error(error.response?.data?.detail || "Failed to save business");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete your business? This action cannot be undone.")) {
      return;
    }

    try {
      await api.delete('/api/v1/business/');
      setBusiness(null);
      setIsEditing(true);
      setFormData({
        name: "", about_us: "", industry_type: "", customer_type: "",
        landing_page_url: "", instagram_url: "", linkedin_url: "", x_url: ""
      });
      toast.success("Business deleted successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to delete business");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p>Loading business information...</p>
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
            {business && (
              <Link to="/analyze">
                <Button variant="gradient">
                  Analyze Brand
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
              {business ? 'Business Profile' : 'Create Your Business Profile'}
            </h1>
            <p className="text-xl text-muted-foreground">
              {business 
                ? 'Manage your business information and URLs for analysis'
                : 'Set up your business profile to start analyzing your brand'
              }
            </p>
          </div>

          <Card className="shadow-brand">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-primary" />
                  <CardTitle>Business Information</CardTitle>
                </div>
                {business && !isEditing && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={handleDelete}>
                      <Trash className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                )}
              </div>
              <CardDescription>
                {isEditing 
                  ? "Update your business information below"
                  : "Your business information"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Business Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      disabled={!isEditing}
                      placeholder="Enter your business name"
                      className={!isEditing ? "bg-muted" : ""}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry *</Label>
                    <Select
                      value={formData.industry_type}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, industry_type: value }))}
                      disabled={!isEditing}
                    >
                      <SelectTrigger className={!isEditing ? "bg-muted" : ""}>
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
                  <Label htmlFor="about_us">About Your Business *</Label>
                  <Textarea
                    id="about_us"
                    value={formData.about_us}
                    onChange={(e) => setFormData(prev => ({ ...prev, about_us: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="Describe your business, products, or services..."
                    rows={4}
                    className={!isEditing ? "bg-muted" : ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer_type">Target Audience *</Label>
                  <Select
                    value={formData.customer_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, customer_type: value }))}
                    disabled={!isEditing}
                  >
                    <SelectTrigger className={!isEditing ? "bg-muted" : ""}>
                      <SelectValue placeholder="Select your target audience" />
                    </SelectTrigger>
                    <SelectContent>
                      {audiences.map(audience => (
                        <SelectItem key={audience} value={audience}>
                          {audience}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* URLs Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <LinkIcon className="w-4 h-4 text-primary" />
                    <h3 className="text-lg font-semibold">Business URLs</h3>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="landing_page_url">Website URL</Label>
                      <Input
                        id="landing_page_url"
                        value={formData.landing_page_url}
                        onChange={(e) => setFormData(prev => ({ ...prev, landing_page_url: e.target.value }))}
                        disabled={!isEditing}
                        placeholder="https://yourbusiness.com"
                        className={!isEditing ? "bg-muted" : ""}
                      />
                      {urlErrors.landing_page_url && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{urlErrors.landing_page_url}</AlertDescription>
                        </Alert>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="instagram_url">Instagram URL</Label>
                      <Input
                        id="instagram_url"
                        value={formData.instagram_url}
                        onChange={(e) => setFormData(prev => ({ ...prev, instagram_url: e.target.value }))}
                        disabled={!isEditing}
                        placeholder="https://instagram.com/yourbusiness"
                        className={!isEditing ? "bg-muted" : ""}
                      />
                      {urlErrors.instagram_url && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{urlErrors.instagram_url}</AlertDescription>
                        </Alert>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                      <Input
                        id="linkedin_url"
                        value={formData.linkedin_url}
                        onChange={(e) => setFormData(prev => ({ ...prev, linkedin_url: e.target.value }))}
                        disabled={!isEditing}
                        placeholder="https://linkedin.com/company/yourbusiness"
                        className={!isEditing ? "bg-muted" : ""}
                      />
                      {urlErrors.linkedin_url && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{urlErrors.linkedin_url}</AlertDescription>
                        </Alert>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="x_url">X (Twitter) URL</Label>
                      <Input
                        id="x_url"
                        value={formData.x_url}
                        onChange={(e) => setFormData(prev => ({ ...prev, x_url: e.target.value }))}
                        disabled={!isEditing}
                        placeholder="https://x.com/yourbusiness"
                        className={!isEditing ? "bg-muted" : ""}
                      />
                      {urlErrors.x_url && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{urlErrors.x_url}</AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {isEditing && (
                  <div className="flex justify-end gap-4 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        if (business) {
                          setFormData({
                            name: business.name || "",
                            about_us: business.about_us || "",
                            industry_type: business.industry_type || "",
                            customer_type: business.customer_type || "",
                            landing_page_url: business.landing_page_url || "",
                            instagram_url: business.instagram_url || "",
                            linkedin_url: business.linkedin_url || "",
                            x_url: business.x_url || "",
                          });
                          setIsEditing(false);
                        }
                      }}
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSave} 
                      disabled={
                        isSaving || 
                        !formData.name?.trim() || 
                        !formData.industry_type || 
                        !formData.about_us?.trim() || 
                        !formData.customer_type ||
                        Object.keys(urlErrors).length > 0
                      }
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {isSaving ? "Saving..." : "Save Business"}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          {business && !isEditing && (
            <Card className="mt-8 border-primary/20 bg-primary/5">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-2">Ready to Analyze Your Brand?</h3>
                <p className="text-muted-foreground mb-4">
                  Your business profile is set up. Now you can run a comprehensive brand analysis.
                </p>
                <Link to="/analyze">
                  <Button variant="gradient">
                    Start Analysis
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default BusinessProfile;