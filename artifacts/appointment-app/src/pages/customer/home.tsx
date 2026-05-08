import { useState } from "react";
import { useListBusinesses, useListAppointments } from "@workspace/api-client-react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MapPin, Calendar as CalendarIcon, Search, Building2, Star, ChevronRight, Stethoscope, Sparkles, Dumbbell, GraduationCap, Scale, DollarSign, Settings, Car, Home as HomeIcon, Laptop, Hotel, Grid3X3, Clock } from "lucide-react";
import { Link } from "wouter";

const CATEGORIES = [
  { value: "", label: "All", icon: Grid3X3 },
  { value: "healthcare", label: "Healthcare", icon: Stethoscope },
  { value: "beauty_wellness", label: "Beauty & Wellness", icon: Sparkles },
  { value: "fitness", label: "Fitness", icon: Dumbbell },
  { value: "education", label: "Education", icon: GraduationCap },
  { value: "legal", label: "Legal", icon: Scale },
  { value: "financial", label: "Financial", icon: DollarSign },
  { value: "consulting", label: "Consulting", icon: Settings },
  { value: "automotive", label: "Automotive", icon: Car },
  { value: "home_services", label: "Home Services", icon: HomeIcon },
  { value: "technology", label: "Technology", icon: Laptop },
  { value: "hospitality", label: "Hospitality", icon: Hotel },
];

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

function getCategoryLabel(cat: string) {
  return CATEGORIES.find((c) => c.value === cat)?.label || cat;
}

function getCategoryIcon(cat: string) {
  return CATEGORIES.find((c) => c.value === cat)?.icon || Building2;
}

export default function Home() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const { data: businesses, isLoading } = useListBusinesses({
    ...(selectedCategory ? { category: selectedCategory } : {}),
    ...(search ? { search } : {}),
  });

  const { data: allServices } = useListAppointments();

  const filteredBusinesses = businesses?.filter((b) => b.isActive) || [];
  const filteredServices = allServices?.filter((s) =>
    !search || s.title.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Hero */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-8 md:p-12">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 right-8 w-64 h-64 rounded-full bg-white/20 blur-3xl" />
            <div className="absolute bottom-0 left-12 w-40 h-40 rounded-full bg-white/20 blur-2xl" />
          </div>
          <div className="relative space-y-4">
            <div className="flex items-center gap-2 text-primary-foreground/80">
              <Building2 className="h-5 w-5" />
              <span className="text-sm font-medium uppercase tracking-wider">BookSlot Platform</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Discover & Book Services
            </h1>
            <p className="text-lg text-primary-foreground/80 max-w-xl">
              Browse verified businesses and book appointments instantly. Healthcare, beauty, fitness, legal, and more.
            </p>
            <div className="relative max-w-md mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-10 bg-white/95 text-foreground border-0 focus-visible:ring-2 focus-visible:ring-primary-foreground/30 h-12"
                placeholder="Search businesses, services, cities..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Browse by Category</h2>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    selectedCategory === cat.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/50 text-muted-foreground border-border hover:border-primary/30 hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Business Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">
              {selectedCategory ? getCategoryLabel(selectedCategory) : "All Businesses"}
              {!isLoading && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({filteredBusinesses.length} {filteredBusinesses.length === 1 ? "result" : "results"})
                </span>
              )}
            </h2>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="animate-pulse border-border shadow-sm overflow-hidden">
                  <div className="h-32 bg-muted"></div>
                  <CardHeader className="space-y-2">
                    <div className="h-5 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                    <div className="h-4 bg-muted rounded w-full"></div>
                  </CardHeader>
                  <CardFooter>
                    <div className="h-10 bg-muted rounded w-full"></div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : filteredBusinesses.length === 0 ? (
            <div className="text-center py-20 bg-card border rounded-xl shadow-sm">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
              <h3 className="mt-4 text-lg font-semibold text-foreground">No businesses found</h3>
              <p className="mt-2 text-muted-foreground max-w-sm mx-auto">
                {search ? `No results for "${search}". Try a different search.` : "No businesses match this category yet."}
              </p>
              {(search || selectedCategory) && (
                <Button variant="outline" className="mt-4" onClick={() => { setSearch(""); setSelectedCategory(""); }}>
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBusinesses.map((biz) => {
                const CategoryIcon = getCategoryIcon(biz.category);
                const gradientClass = CATEGORY_BG[biz.category] || CATEGORY_BG.other;
                const badgeClass = CATEGORY_COLORS[biz.category] || CATEGORY_COLORS.other;
                return (
                  <Card key={biz.id} className="flex flex-col hover-elevate transition-all border-border shadow-sm group overflow-hidden">
                    {/* Cover / Category Banner */}
                    <div className={`relative h-32 bg-gradient-to-br ${gradientClass} flex items-center justify-center`}>
                      <CategoryIcon className="h-12 w-12 text-white/80" />
                      {biz.isVerified && (
                        <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/20 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full border border-white/30">
                          <Star className="h-3 w-3 fill-white" />
                          Verified
                        </div>
                      )}
                    </div>

                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-lg line-clamp-1 group-hover:text-primary transition-colors">
                          {biz.name}
                        </CardTitle>
                      </div>
                      <Badge variant="outline" className={`self-start text-xs ${badgeClass}`}>
                        {getCategoryLabel(biz.category)}
                      </Badge>
                      <CardDescription className="line-clamp-2 mt-1 text-sm">
                        {biz.description || "Professional services available for booking."}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="flex-1 space-y-2 pt-0">
                      {(biz.city || biz.country) && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="mr-2 h-3.5 w-3.5 text-primary/60 shrink-0" />
                          <span className="truncate">{[biz.city, biz.country].filter(Boolean).join(", ")}</span>
                        </div>
                      )}
                      <div className="flex items-center text-sm text-muted-foreground">
                        <CalendarIcon className="mr-2 h-3.5 w-3.5 text-primary/60 shrink-0" />
                        <span>{biz.appointmentCount ?? 0} {(biz.appointmentCount ?? 0) === 1 ? "service" : "services"} available</span>
                      </div>
                    </CardContent>

                    <CardFooter className="pt-4 border-t border-border/50 bg-muted/10">
                      <Link href={`/business/${biz.slug}`} className="w-full">
                        <Button className="w-full group/btn">
                          View Services
                          <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* All Available Services */}
        {!selectedCategory && filteredServices.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">
                All Available Services
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({filteredServices.length} {filteredServices.length === 1 ? "service" : "services"})
                </span>
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredServices.map((svc) => {
                const badgeClass = CATEGORY_COLORS[svc.business?.category || "other"] || CATEGORY_COLORS.other;
                return (
                  <Card key={svc.id} className="flex flex-col border-border shadow-sm hover:shadow-md transition-shadow group">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base line-clamp-1 group-hover:text-primary transition-colors">
                          {svc.title}
                        </CardTitle>
                        {svc.duration && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                            <Clock className="h-3.5 w-3.5" />
                            {svc.duration}m
                          </div>
                        )}
                      </div>
                      {svc.business && (
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className={`text-xs ${badgeClass}`}>
                            {getCategoryLabel(svc.business.category)}
                          </Badge>
                          <span className="text-xs text-muted-foreground truncate">
                            @ {svc.business.name}
                          </span>
                        </div>
                      )}
                      {svc.description && (
                        <CardDescription className="line-clamp-2 text-sm mt-1">
                          {svc.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="flex-1 pt-0">
                      {svc.business?.city && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <MapPin className="mr-1.5 h-3 w-3 text-primary/60" />
                          {svc.business.city}
                        </div>
                      )}
                      {svc.advancePayment && svc.paymentAmount && (
                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                          <CalendarIcon className="mr-1.5 h-3 w-3 text-primary/60" />
                          Advance payment: ₹{svc.paymentAmount}
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="pt-3 border-t border-border/50">
                      <Link href={svc.business?.slug ? `/business/${svc.business.slug}` : "#"} className="w-full">
                        <Button variant="outline" size="sm" className="w-full">
                          Book Now
                          <ChevronRight className="ml-2 h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
