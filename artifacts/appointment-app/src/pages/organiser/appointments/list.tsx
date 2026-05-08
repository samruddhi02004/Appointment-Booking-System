import { useState } from "react";
import { Link } from "wouter";
import { useListAppointments, usePublishAppointment, useDeleteAppointment } from "@workspace/api-client-react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, MoreVertical, Edit, Copy, Eye, Trash2, Loader2, Link as LinkIcon, CheckCircle2 } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { format } from "date-fns";

export default function OrganiserAppointments() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const { toast } = useToast();

  const { data: appointments, isLoading, refetch } = useListAppointments({
    search: debouncedSearch
  });

  const publishMutation = usePublishAppointment();
  const deleteMutation = useDeleteAppointment();

  const handleTogglePublish = (id: number, currentStatus: boolean) => {
    publishMutation.mutate(
      { appointmentId: id, data: { isPublished: !currentStatus } },
      {
        onSuccess: () => {
          toast({ title: `Appointment ${!currentStatus ? 'published' : 'unpublished'} successfully` });
          refetch();
        }
      }
    );
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this appointment type? This cannot be undone.")) {
      deleteMutation.mutate(
        { appointmentId: id },
        {
          onSuccess: () => {
            toast({ title: "Appointment deleted successfully" });
            refetch();
          }
        }
      );
    }
  };

  const copyShareLink = (id: number) => {
    const link = `${window.location.origin}/book/${id}`;
    navigator.clipboard.writeText(link);
    toast({ title: "Link copied to clipboard" });
  };

  return (
    <MainLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Appointment Types</h1>
            <p className="text-muted-foreground mt-2">Manage the services you offer to customers.</p>
          </div>
          <Link href="/organiser/appointments/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Create New
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search appointments..." 
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse h-[250px]" />
            ))}
          </div>
        ) : appointments?.length === 0 ? (
          <div className="text-center py-20 bg-card border rounded-lg shadow-sm">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <LinkIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No appointments found</h3>
            <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
              {search ? "No appointments match your search criteria." : "Create your first appointment type to start accepting bookings."}
            </p>
            {!search && (
              <Link href="/organiser/appointments/new">
                <Button className="mt-6">Create Appointment</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {appointments?.map((apt) => (
              <Card key={apt.id} className="flex flex-col border-border shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant={apt.isPublished ? "default" : "secondary"} className={apt.isPublished ? "bg-green-500 hover:bg-green-600" : ""}>
                      {apt.isPublished ? "Published" : "Draft"}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <Link href={`/organiser/appointments/${apt.id}/edit`}>
                          <DropdownMenuItem className="cursor-pointer">
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                        </Link>
                        <DropdownMenuItem className="cursor-pointer" onClick={() => copyShareLink(apt.id)}>
                          <Copy className="mr-2 h-4 w-4" /> Copy Link
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer" onClick={() => handleTogglePublish(apt.id, apt.isPublished)}>
                          {apt.isPublished ? <Eye className="mr-2 h-4 w-4" /> : <CheckCircle2 className="mr-2 h-4 w-4" />} 
                          {apt.isPublished ? "Unpublish" : "Publish"}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onClick={() => handleDelete(apt.id)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardTitle className="text-xl line-clamp-1">{apt.title}</CardTitle>
                  <CardDescription className="line-clamp-2 mt-1 min-h-[2.5rem]">
                    {apt.description || "No description provided."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-3 pb-4">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Duration:</span> <span className="font-medium">{apt.duration} mins</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Type:</span> <span className="font-medium capitalize">{apt.scheduleType}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Price:</span> <span className="font-medium">{apt.advancePayment ? `$${apt.paymentAmount}` : "Free"}</span>
                  </div>
                </CardContent>
                <CardFooter className="pt-4 border-t text-xs text-muted-foreground">
                  Created {format(new Date(apt.createdAt), "MMM d, yyyy")}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
