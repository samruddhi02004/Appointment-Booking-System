import { useState } from "react";
import type { CreateBusinessBody } from "@workspace/api-client-react";
import { useGetMyBusiness, useCreateBusiness, useUpdateBusiness } from "@workspace/api-client-react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Building2, Globe, Phone, Mail, MapPin, CheckCircle2, Star, Pencil, Save } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetMyBusinessQueryKey } from "@workspace/api-client-react";

type BusinessCategory = CreateBusinessBody["category"];

const CATEGORIES = [
  { value: "healthcare", label: "Healthcare" },
  { value: "beauty_wellness", label: "Beauty & Wellness" },
  { value: "fitness", label: "Fitness" },
  { value: "education", label: "Education" },
  { value: "legal", label: "Legal" },
  { value: "financial", label: "Financial" },
  { value: "consulting", label: "Consulting" },
  { value: "automotive", label: "Automotive" },
  { value: "home_services", label: "Home Services" },
  { value: "technology", label: "Technology" },
  { value: "hospitality", label: "Hospitality" },
  { value: "other", label: "Other" },
] as const satisfies ReadonlyArray<{ value: BusinessCategory; label: string }>;

function normalizeCategory(value?: string): BusinessCategory {
  const found = CATEGORIES.find((c) => c.value === (value as BusinessCategory));
  return found ? found.value : "other";
}

export default function BusinessSetup() {
  const { data: business, isLoading } = useGetMyBusiness();
  const createBusiness = useCreateBusiness();
  const updateBusiness = useUpdateBusiness();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<CreateBusinessBody>({
    name: "",
    description: "",
    category: "other",
    city: "",
    country: "",
    address: "",
    phone: "",
    email: "",
    website: "",
  });

  const handleStartCreate = () => {
    setForm({ name: "", description: "", category: "other", city: "", country: "", address: "", phone: "", email: "", website: "" });
    setEditing(true);
  };

  const handleStartEdit = () => {
    if (business) {
      setForm({
        name: business.name || "",
        description: business.description || "",
        category: normalizeCategory(business.category),
        city: business.city || "",
        country: business.country || "",
        address: business.address || "",
        phone: business.phone || "",
        email: business.email || "",
        website: business.website || "",
      });
      setEditing(true);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: "Business name is required", variant: "destructive" });
      return;
    }

    try {
      if (business) {
        await updateBusiness.mutateAsync({ businessId: business.id, data: form });
        toast({ title: "Business profile updated!" });
      } else {
        await createBusiness.mutateAsync({ data: form });
        toast({ title: "Business created successfully!", description: "Customers can now find and book your services." });
      }
      queryClient.invalidateQueries({ queryKey: getGetMyBusinessQueryKey() });
      setEditing(false);
    } catch (e: any) {
      toast({ title: "Something went wrong", description: e?.message, variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="max-w-3xl mx-auto space-y-6 animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-48 bg-muted rounded-xl" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Business</h1>
          <p className="text-muted-foreground mt-2">Manage your business profile visible to customers on BookSlot.</p>
        </div>

        {/* No Business Yet */}
        {!business && !editing && (
          <Card className="border-dashed border-2 border-border text-center py-12">
            <CardContent className="space-y-4">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Set Up Your Business</h2>
                <p className="text-muted-foreground text-sm mt-1 max-w-sm mx-auto">
                  Create your business profile so customers can discover your services and book appointments.
                </p>
              </div>
              <Button onClick={handleStartCreate} size="lg">
                <Building2 className="mr-2 h-5 w-5" />
                Create Business Profile
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Business Profile Display */}
        {business && !editing && (
          <div className="space-y-6">
            <Card className="border-border shadow-sm overflow-hidden">
              <div className="h-2 bg-primary w-full" />
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="text-2xl">{business.name}</CardTitle>
                    {business.isVerified && (
                      <div className="flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 text-xs px-2 py-0.5 rounded-full">
                        <Star className="h-3 w-3 fill-emerald-700" />
                        Verified
                      </div>
                    )}
                    <Badge variant={business.isActive ? "default" : "secondary"}>
                      {business.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <CardDescription className="text-sm capitalize">{business.category?.replace(/_/g, " ")}</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={handleStartEdit}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {business.description && (
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">About</Label>
                    <p className="mt-1 text-sm leading-relaxed">{business.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {business.address && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p>{business.address}</p>
                        <p className="text-muted-foreground">{[business.city, business.country].filter(Boolean).join(", ")}</p>
                      </div>
                    </div>
                  )}
                  {business.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                      {business.phone}
                    </div>
                  )}
                  {business.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                      {business.email}
                    </div>
                  )}
                  {business.website && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                      {business.website}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 p-3 bg-muted/40 rounded-lg text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  <span>Your business slug: <code className="font-mono text-primary font-medium">/{business.slug}</code></span>
                </div>
              </CardContent>
            </Card>

            {/* Stats summary */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="text-center border-border shadow-sm">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{business.appointmentCount ?? 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">Published Services</p>
                </CardContent>
              </Card>
              <Card className="text-center border-border shadow-sm">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{business.isVerified ? "Yes" : "No"}</div>
                  <p className="text-xs text-muted-foreground mt-1">Verified Business</p>
                </CardContent>
              </Card>
              <Card className="text-center border-border shadow-sm">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold capitalize">{business.category?.replace(/_/g, " ").split(" ")[0]}</div>
                  <p className="text-xs text-muted-foreground mt-1">Category</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Edit / Create Form */}
        {editing && (
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle>{business ? "Edit Business Profile" : "Create Your Business"}</CardTitle>
              <CardDescription>Fill in your business details. Customers will see this information when browsing BookSlot.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="name">Business Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g. HealthFirst Clinic"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your business and the services you offer..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Category *</Label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setForm({ ...form, category: cat.value })}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                          form.category === cat.value
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted/50 text-muted-foreground border-border hover:border-primary/30"
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="e.g. Mumbai"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    placeholder="e.g. India"
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    placeholder="Street address"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    placeholder="+91 98765 43210"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Business Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contact@yourbusiness.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    placeholder="https://yourbusiness.com"
                    value={form.website}
                    onChange={(e) => setForm({ ...form, website: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleSave}
                  disabled={createBusiness.isPending || updateBusiness.isPending}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {createBusiness.isPending || updateBusiness.isPending ? "Saving..." : business ? "Save Changes" : "Create Business"}
                </Button>
                <Button variant="outline" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
