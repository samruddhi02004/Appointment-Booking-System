import { useParams, Link } from "wouter";
import { getGetBookingQueryKey, useGetBooking } from "@workspace/api-client-react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Calendar, Clock, MapPin, Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function BookingConfirmation() {
  const { bookingId } = useParams();
  const bookingIdNum = bookingId ? Number(bookingId) : 0;
  
  const { data: booking, isLoading } = useGetBooking(bookingIdNum, {
    query: { queryKey: getGetBookingQueryKey(bookingIdNum), enabled: !!bookingId }
  });

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!booking) {
    return (
      <MainLayout>
        <div className="text-center py-20">Booking not found.</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto pt-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
            <CheckCircle className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Booking Confirmed!</h1>
          <p className="text-muted-foreground mt-2 text-lg">Your appointment has been successfully scheduled.</p>
        </div>

        <Card className="border-border shadow-md overflow-hidden">
          <div className="bg-primary h-2 w-full" />
          <CardHeader className="bg-muted/10 border-b pb-6">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">{booking.appointmentType?.title}</CardTitle>
                <div className="text-muted-foreground mt-1">Booking ID: #{booking.id}</div>
              </div>
              <Badge className={booking.status === "confirmed" ? "bg-green-500/20 text-green-700 hover:bg-green-500/30" : ""}>
                {booking.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Date
                </div>
                <div className="font-medium text-lg">
                  {format(new Date(booking.startTime), "EEEE, MMMM d, yyyy")}
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Time
                </div>
                <div className="font-medium text-lg">
                  {format(new Date(booking.startTime), "h:mm a")} - {format(new Date(booking.endTime), "h:mm a")}
                </div>
              </div>

              {booking.appointmentType?.location && (
                <div className="space-y-1 sm:col-span-2">
                  <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Location
                  </div>
                  <div className="font-medium text-lg">
                    {booking.appointmentType.location}
                  </div>
                </div>
              )}
            </div>

            {booking.paymentStatus && booking.appointmentType?.advancePayment && (
              <div className="pt-6 border-t border-border flex justify-between items-center">
                <div className="text-muted-foreground">Payment Status</div>
                <Badge variant={booking.paymentStatus === "paid" ? "default" : "secondary"}>
                  {booking.paymentStatus}
                </Badge>
              </div>
            )}
          </CardContent>
          <CardFooter className="bg-muted/20 p-6 flex flex-col sm:flex-row gap-3 border-t">
            <Link href="/my-bookings" className="w-full sm:w-auto sm:flex-1">
              <Button variant="outline" className="w-full">View All Bookings</Button>
            </Link>
            <Link href="/" className="w-full sm:w-auto sm:flex-1">
              <Button className="w-full">Book Another</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </MainLayout>
  );
}
