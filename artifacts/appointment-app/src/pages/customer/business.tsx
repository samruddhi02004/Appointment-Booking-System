import { type ElementType } from "react";
import { useGetBusinessBySlug, useListAppointments } from "@workspace/api-client-react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Phone, Globe, Mail, ArrowLeft, Building2, Star, Calendar, ChevronRight, Stethoscope, Sparkles, Dumbbell, GraduationCap, Scale, DollarSign, Settings, Car, Home as HomeIcon, Laptop, Hotel } from "lucide-react";
import { Link, useParams } from "wouter";

const CATEGORY_COLORS: Record<string, string> = {
  healthcare: "bg-blue-50 text-blue-700 border-blue-200",
  beauty_wellness: "bg-pink-50 text-pink-700 border-pink-200",
  fitness: "bg-orange-50 text-orange-700 border-orange-200",
  education: "bg-purple-50 text-purple-700 border-purple-200",
  legal: "bg-slate-50 text-slate-700 border-slate-200",
  financial: "bg-green-50 text-green-700 border-green-200",
  consulting: "bg-indigo-50 text-indigo-700 border-indigo-200",
  automotive: "bg-red-50 text-red-700 border-red-200",
  home_services: "bg-yellow-50 text-yellow-700 border-yellow-200",
  technology: "bg-cyan-50 text-cyan-700 border-cyan-200",
  hospitality: "bg-amber-50 text-amber-700 border-amber-200",
  other: "bg-gray-50 text-gray-700 border-gray-200",
};

const CATEGORY_BG: Record<string, string> = {
  healthcare: "from-blue-500 to-blue-600",
  beauty_wellness: "from-pink-500 to-pink-600",
  fitness: "from-orange-500 to-orange-600",
  education: "from-purple-500 to-purple-600",
  legal: "from-slate-500 to-slate-600",
  financial: "from-green-500 to-green-600",
  consulting: "from-indigo-500 to-indigo-600",
  automotive: "from-red-500 to-red-600",
  home_services: "from-yellow-500 to-yellow-600",
  technology: "from-cyan-500 to-cyan-600",
  hospitality: "from-amber-500 to-amber-600",
  other: "from-gray-500 to-gray-600",
};

const CATEGORY_ICONS: Record<string, ElementType> = {
  healthcare: Stethoscope,
  beauty_wellness: Sparkles,
  fitness: Dumbbell,
  education: GraduationCap,
  legal: Scale,
  financial: DollarSign,
  consulting: Settings,
  automotive: Car,
  home_services: HomeIcon,
  technology: Laptop,
  hospitality: Hotel,
  other: Building2,
};

const CATEGORY_LABELS: Record<string, string> = {
  healthcare: "Healthcare",
  beauty_wellness: "Beauty & Wellness",
  fitness: "Fitness",
  education: "Education",
  legal: "Legal",
  financial: "Financial",
  consulting: "Consulting",
  automotive: "Automotive",
  home_services: "Home Services",
  technology: "Technology",
  hospitality: "Hospitality",
  other: "Other",
};

export default function BusinessPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: business, isLoading: bizLoading } = useGetBusinessBySlug(slug || "");
  const { data: appointments, isLoading: aptsLoading } = useListAppointments(
    business ? { businessId: business.id, published: true } : undefined
  );

  if (bizLoading) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
          <div className="h-48 bg-muted rounded-2xl" />
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-4 bg-muted rounded w-2/3" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-48 bg-muted rounded-xl" />)}
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!business) {
    return (
      <MainLayout>
        <div className="text-center py-20">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-semibold">Business not found</h2>
          <Link href="/">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Directory
            </Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  const CategoryIcon = CATEGORY_ICONS[business.category] || Building2;
  const gradientClass = CATEGORY_BG[business.category] || CATEGORY_BG.other;
  const badgeClass = CATEGORY_COLORS[business.category] || CATEGORY_COLORS.other;

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Back button */}
        <Link href="/">
          <Button variant="ghost" className="gap-2 -ml-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Directory
          </Button>
        </Link>

        {/* Business Header */}
        <div className={`relative rounded-2xl overflow-hidden bg-gradient-to-br ${gradientClass} text-white`}>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 right-8 w-64 h-64 rounded-full bg-white/20 blur-3xl" />
          </div>
          <div className="relative p-8 md:p-10">
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shrink-0">
                <CategoryIcon className="h-10 w-10 text-white" />
              </div>
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl md:text-3xl font-bold">{business.name}</h1>
                  {business.isVerified && (
                    <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full border border-white/30">
                      <Star className="h-3 w-3 fill-white" />
                      Verified
                    </div>
                  )}
                </div>
                <Badge variant="outline" className={`border ${badgeClass} bg-white`}>
                  {CATEGORY_LABELS[business.category] || business.category}
                </Badge>
                {business.description && (
                  <p className="text-white/85 text-base leading-relaxed max-w-2xl">{business.description}</p>
                )}

                {/* Contact row */}
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/80 mt-2">
                  {(business.city || business.country) && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" />
                      {[business.address, business.city, business.country].filter(Boolean).join(", ")}
                    </div>
                  )}
                  {business.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-4 w-4" />
                      {business.phone}
                    </div>
                  )}
                  {business.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-4 w-4" />
                      {business.email}
                    </div>
                  )}
                  {business.website && (
                    <div className="flex items-center gap-1.5">
                      <Globe className="h-4 w-4" />
                      {business.website}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Available Services */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Available Services</h2>
              <p className="text-muted-foreground text-sm">Select a service to book your appointment</p>
            </div>
            {!aptsLoading && (
              <Badge variant="outline" className="text-muted-foreground">
                {appointments?.length ?? 0} {(appointments?.length ?? 0) === 1 ? "service" : "services"}
              </Badge>
            )}
          </div>

          {aptsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="animate-pulse border-border">
                  <CardHeader>
                    <div className="h-5 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-full" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </CardContent>
                  <CardFooter>
                    <div className="h-10 bg-muted rounded w-full" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : appointments?.length === 0 ? (
            <div className="text-center py-16 bg-card border rounded-xl shadow-sm">
              <Calendar className="mx-auto h-10 w-10 text-muted-foreground opacity-50" />
              <h3 className="mt-4 text-lg font-semibold">No services available yet</h3>
              <p className="mt-2 text-muted-foreground text-sm">This business hasn't published any appointment types yet. Check back later.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {appointments?.map((apt) => (
                <Card key={apt.id} className="flex flex-col hover-elevate transition-all border-border shadow-sm group">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg line-clamp-1 group-hover:text-primary transition-colors">{apt.title}</CardTitle>
                      {apt.advancePayment && apt.paymentAmount && (
                        <span className="text-base font-bold text-foreground shrink-0">₹{apt.paymentAmount}</span>
                      )}
                    </div>
                    <CardDescription className="line-clamp-2">
                      {apt.description || "Professional service available for booking."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-2 pt-0">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="mr-2 h-3.5 w-3.5 text-primary/60" />
                      {apt.duration} minutes
                    </div>
                    {apt.location && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="mr-2 h-3.5 w-3.5 text-primary/60" />
                        <span className="truncate">{apt.location}</span>
                      </div>
                    )}
                    {apt.manualConfirmation && (
                      <Badge variant="outline" className="text-xs text-amber-700 border-amber-200 bg-amber-50">
                        Requires confirmation
                      </Badge>
                    )}
                  </CardContent>
                  <CardFooter className="pt-4 border-t border-border/50">
                    <Link href={`/book/${apt.id}`} className="w-full">
                      <Button className="w-full group/btn">
                        Book Now
                        <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
