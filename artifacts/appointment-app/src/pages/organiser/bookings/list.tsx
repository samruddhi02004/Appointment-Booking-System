import { useState } from "react";
import { useListBookings, useConfirmBooking, useCancelBooking } from "@workspace/api-client-react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Loader2, Search, Check, X, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

export default function OrganiserBookings() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();

  const { data: bookings, isLoading, refetch } = useListBookings({
    status: statusFilter !== "all" ? statusFilter as any : undefined
  });

  const confirmMutation = useConfirmBooking();
  const cancelMutation = useCancelBooking();

  const handleConfirm = (id: number) => {
    confirmMutation.mutate(
      { bookingId: id },
      {
        onSuccess: () => {
          toast({ title: "Booking confirmed" });
          refetch();
        }
      }
    );
  };

  const handleCancel = (id: number) => {
    if (confirm("Are you sure you want to cancel this booking?")) {
      cancelMutation.mutate(
        { bookingId: id },
        {
          onSuccess: () => {
            toast({ title: "Booking cancelled" });
            refetch();
          }
        }
      );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed": return <Badge className="bg-primary/20 text-primary border-primary/30">Confirmed</Badge>;
      case "pending": return <Badge variant="secondary">Pending</Badge>;
      case "cancelled": return <Badge variant="destructive">Cancelled</Badge>;
      case "completed": return <Badge className="bg-green-500/20 text-green-700 border-green-500/30">Completed</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <MainLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Bookings</h1>
            <p className="text-muted-foreground mt-2">Manage all customer appointments.</p>
          </div>
        </div>

        <Card className="border-border shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by customer name..." className="pl-10" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : bookings?.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg">
                No bookings found.
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings?.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell>
                          <div className="font-medium">{booking.customer?.fullName}</div>
                          <div className="text-xs text-muted-foreground">{booking.customer?.email}</div>
                        </TableCell>
                        <TableCell>{booking.appointmentType?.title}</TableCell>
                        <TableCell>
                          <div className="font-medium">{format(new Date(booking.startTime), "MMM d, yyyy")}</div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(booking.startTime), "h:mm a")} - {format(new Date(booking.endTime), "h:mm a")}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(booking.status)}</TableCell>
                        <TableCell className="text-right space-x-2">
                          {booking.status === "pending" && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                              onClick={() => handleConfirm(booking.id)}
                            >
                              <Check className="h-4 w-4 mr-1" /> Confirm
                            </Button>
                          )}
                          {(booking.status === "pending" || booking.status === "confirmed") && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-destructive border-red-200 hover:bg-red-50"
                              onClick={() => handleCancel(booking.id)}
                            >
                              <X className="h-4 w-4 mr-1" /> Cancel
                            </Button>
                          )}
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
