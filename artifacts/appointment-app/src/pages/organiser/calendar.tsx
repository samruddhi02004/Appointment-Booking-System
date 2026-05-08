import { useState } from "react";
import { useListBookings } from "@workspace/api-client-react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { format, addDays, startOfWeek, addWeeks, subWeeks, isSameDay } from "date-fns";

export default function OrganiserCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  const { data: bookings, isLoading } = useListBookings({
    fromDate: format(weekStart, "yyyy-MM-dd"),
    toDate: format(addDays(weekStart, 6), "yyyy-MM-dd")
  });

  const nextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  const prevWeek = () => setCurrentDate(subWeeks(currentDate, 1));
  const today = () => setCurrentDate(new Date());

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-primary/20 border-primary/50 text-primary-foreground";
      case "pending": return "bg-amber-100 border-amber-300 text-amber-800";
      case "completed": return "bg-green-100 border-green-300 text-green-800";
      default: return "bg-muted border-muted-foreground/30 text-muted-foreground";
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6 max-w-7xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
            <p className="text-muted-foreground mt-1">View your schedule at a glance.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={today}>Today</Button>
            <div className="flex items-center gap-1 bg-muted p-1 rounded-md">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prevWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium w-32 text-center">
                {format(weekStart, "MMM d")} - {format(addDays(weekStart, 6), "MMM d")}
              </span>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <Card className="border-border shadow-sm flex-1 flex flex-col overflow-hidden">
          <CardContent className="p-0 flex-1 flex flex-col h-full overflow-hidden">
            <div className="grid grid-cols-7 border-b border-border bg-muted/30 flex-shrink-0">
              {days.map((day) => (
                <div key={day.toISOString()} className="p-3 text-center border-r border-border last:border-0">
                  <div className="text-xs text-muted-foreground uppercase">{format(day, "EEE")}</div>
                  <div className={`text-lg font-medium mt-1 ${isSameDay(day, new Date()) ? 'bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center mx-auto' : ''}`}>
                    {format(day, "d")}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 bg-muted/5">
              {isLoading ? (
                <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : (
                <div className="grid grid-cols-7 h-full min-h-[500px]">
                  {days.map((day) => {
                    const dayBookings = bookings?.filter(b => isSameDay(new Date(b.startTime), day) && b.status !== "cancelled") || [];
                    
                    return (
                      <div key={day.toISOString()} className="border-r border-border last:border-0 p-2 space-y-2">
                        {dayBookings.map((booking) => (
                          <div 
                            key={booking.id} 
                            className={`p-2 rounded border text-xs shadow-sm ${getStatusColor(booking.status)}`}
                          >
                            <div className="font-semibold truncate">{format(new Date(booking.startTime), "h:mm a")}</div>
                            <div className="truncate mt-0.5">{booking.appointmentType?.title}</div>
                            <div className="truncate opacity-80">{booking.customer?.fullName}</div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
