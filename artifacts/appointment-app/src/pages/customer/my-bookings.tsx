import { useListBookings, useCancelBooking } from "@workspace/api-client-react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, XCircle } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function MyBookings() {
  const { data: bookings, isLoading, refetch } = useListBookings();
  const cancelMutation = useCancelBooking();
  const { toast } = useToast();

  const handleCancel = (bookingId: number) => {
    if (confirm("Are you sure you want to cancel this booking?")) {
      cancelMutation.mutate(
        { bookingId },
        {
          onSuccess: () => {
            toast({ title: "Booking cancelled successfully" });
            refetch();
          },
          onError: () => {
            toast({ title: "Failed to cancel booking", variant: "destructive" });
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
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Bookings</h1>
          <p className="text-muted-foreground mt-2">Manage your upcoming and past appointments.</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="h-24 bg-muted/50" />
                <CardContent className="h-32" />
              </Card>
            ))}
          </div>
        ) : bookings?.length === 0 ? (
          <div className="text-center py-20 bg-card border rounded-lg shadow-sm">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
            <h3 className="mt-4 text-lg font-semibold">No bookings found</h3>
            <p className="mt-2 text-muted-foreground">You haven't made any bookings yet.</p>
            <Link href="/">
              <Button className="mt-6">Browse Services</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {bookings?.map((booking) => (
              <Card key={booking.id} className="overflow-hidden border-border shadow-sm flex flex-col md:flex-row">
                <div className="w-2 bg-primary flex-shrink-0" />
                <div className="flex-1 p-6 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <CardTitle className="text-xl">{booking.appointmentType?.title}</CardTitle>
                        {getStatusBadge(booking.status)}
                      </div>
                      <CardDescription>ID: #{booking.id}</CardDescription>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary/70" />
                        {format(new Date(booking.startTime), "EEEE, MMMM d, yyyy")}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary/70" />
                        {format(new Date(booking.startTime), "h:mm a")} - {format(new Date(booking.endTime), "h:mm a")}
                      </div>
                      {booking.appointmentType?.location && (
                        <div className="flex items-center gap-2 sm:col-span-2">
                          <MapPin className="h-4 w-4 text-primary/70" />
                          {booking.appointmentType.location}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col gap-3 w-full md:w-auto">
                    <Link href={`/booking-confirmation/${booking.id}`} className="flex-1 md:w-full">
                      <Button variant="outline" className="w-full">View Details</Button>
                    </Link>
                    {(booking.status === "pending" || booking.status === "confirmed") && (
                      <Button 
                        variant="ghost" 
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-1 md:w-full"
                        onClick={() => handleCancel(booking.id)}
                        disabled={cancelMutation.isPending}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
