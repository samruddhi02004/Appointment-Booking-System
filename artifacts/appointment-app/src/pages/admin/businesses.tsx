import { useListBusinesses, useUpdateBusiness } from "@workspace/api-client-react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2, Search, CheckCircle2, XCircle, MapPin, Star, Calendar } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getListBusinessesQueryKey } from "@workspace/api-client-react";
import { format } from "date-fns";

const CATEGORY_LABELS: Record<string, string> = {
  healthcare: "Healthcare", beauty_wellness: "Beauty & Wellness", fitness: "Fitness",
  education: "Education", legal: "Legal", financial: "Financial", consulting: "Consulting",
  automotive: "Automotive", home_services: "Home Services", technology: "Technology",
  hospitality: "Hospitality", other: "Other",
};

export default function AdminBusinesses() {
  const [search, setSearch] = useState("");
  const { data: businesses, isLoading } = useListBusinesses(search ? { search } : undefined);
  const updateBusiness = useUpdateBusiness();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleToggleActive = async (bizId: number, currentActive: boolean) => {
    try {
      await updateBusiness.mutateAsync({ businessId: bizId, data: { isActive: !currentActive } });
      queryClient.invalidateQueries({ queryKey: getListBusinessesQueryKey() });
      toast({ title: `Business ${!currentActive ? "activated" : "deactivated"}` });
    } catch {
      toast({ title: "Failed to update", variant: "destructive" });
    }
  };

  const filteredBusinesses = (businesses || []).filter((b) =>
    !search ||
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    (b.city?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  const stats = {
    total: businesses?.length ?? 0,
    active: businesses?.filter((b) => b.isActive).length ?? 0,
    verified: businesses?.filter((b) => b.isVerified).length ?? 0,
  };

  return (
    <MainLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Businesses</h1>
          <p className="text-muted-foreground mt-2">Manage all registered businesses on the platform.</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { title: "Total Businesses", value: stats.total, icon: Building2, color: "text-primary" },
            { title: "Active", value: stats.active, icon: CheckCircle2, color: "text-green-500" },
            { title: "Verified", value: stats.verified, icon: Star, color: "text-amber-500" },
          ].map((card, i) => (
            <Card key={i} className="border-border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-8 w-12 bg-muted animate-pulse rounded" />
                ) : (
                  <div className="text-3xl font-bold">{card.value}</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search + Table */}
        <Card className="border-border shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search businesses..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-14 bg-muted/50 animate-pulse rounded" />
                ))}
              </div>
            ) : filteredBusinesses.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Building2 className="mx-auto h-10 w-10 opacity-30 mb-3" />
                <p>No businesses found</p>
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Business</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Services</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBusinesses.map((biz) => (
                      <TableRow key={biz.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{biz.name}</span>
                              {biz.isVerified && (
                                <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">/{biz.slug}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {CATEGORY_LABELS[biz.category] || biz.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {biz.city ? (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {[biz.city, biz.country].filter(Boolean).join(", ")}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            {biz.appointmentCount ?? 0}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={biz.isActive ? "default" : "secondary"}>
                            {biz.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(biz.createdAt), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(biz.id, biz.isActive)}
                            className={biz.isActive ? "text-destructive hover:text-destructive" : "text-green-600 hover:text-green-700"}
                          >
                            {biz.isActive ? (
                              <><XCircle className="mr-1 h-4 w-4" /> Deactivate</>
                            ) : (
                              <><CheckCircle2 className="mr-1 h-4 w-4" /> Activate</>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
