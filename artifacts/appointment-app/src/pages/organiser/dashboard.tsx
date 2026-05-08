import { useGetMyBusiness, useGetRecentBookings, useListAppointments, useListBookings } from "@workspace/api-client-react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CheckCircle2, Clock, Users, ArrowRight, Building2, AlertCircle, BarChart3 } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/auth-context";

export default function OrganiserDashboard() {
  const { user } = useAuth();
  const { data: business, isLoading: bizLoading } = useGetMyBusiness();
  const { data: recentBookings, isLoading: bookingsLoading } = useGetRecentBookings({ limit: 5 });
  const { data: myApts } = useListAppointments();
  const { data: myBookings } = useListBookings();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 86400000);

  const todayCount = myBookings?.filter(
    (b) => new Date(b.startTime) >= todayStart && new Date(b.startTime) < todayEnd
  ).length ?? 0;

  const upcomingCount = myBookings?.filter(
    (b) => new Date(b.startTime) > now && b.status !== "cancelled"
  ).length ?? 0;

  const confirmedCount = myBookings?.filter((b) => b.status === "confirmed").length ?? 0;
  const pendingCount = myBookings?.filter((b) => b.status === "pending").length ?? 0;

  const statCards = [
    { title: "Today's Bookings", value: todayCount, icon: Calendar, color: "text-blue-500" },
    { title: "Upcoming", value: upcomingCount, icon: Clock, color: "text-amber-500" },
    { title: "Confirmed", value: confirmedCount, icon: CheckCircle2, color: "text-green-500" },
    { title: "Pending Review", value: pendingCount, icon: AlertCircle, color: "text-orange-500" },
  ];

  return (
    <MainLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Header with user name */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome back, {user?.fullName?.split(" ")[0]}
            </h1>
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              {bizLoading ? "Loading business..." : business ? (
                <>
                  <Building2 className="w-3.5 h-3.5 inline" />
                  <span>{business.name}</span>
                  <span className="text-muted-foreground/50">·</span>
                  <span className="capitalize">{business.category?.replace(/_/g, " ")}</span>
                  {business.city && (
                    <>
                      <span className="text-muted-foreground/50">·</span>
                      <span>{business.city}</span>
                    </>
                  )}
                </>
              ) : "Set up your business to get started."}
            </p>
          </div>
          {business && (
            <Link href="/organiser/business">
              <Button variant="outline" size="sm">
                <Building2 className="mr-2 h-4 w-4" />
                Business Settings
              </Button>
            </Link>
          )}
        </div>

        {/* Setup nudge if no business */}
        {!bizLoading && !business && (
          <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <Building2 className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-amber-900 dark:text-amber-100">Set up your business profile</p>
                <p className="text-sm text-amber-700 dark:text-amber-300">Create your business so customers can discover and book your services.</p>
              </div>
              <Link href="/organiser/business">
                <Button size="sm">Set Up Now</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card, i) => (
            <Card key={i} className="border-border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          {/* Recent Bookings */}
          <Card className="lg:col-span-4 border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Bookings</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Latest customer activity.</p>
              </div>
              <Link href="/organiser/bookings">
                <Button variant="ghost" size="sm" className="hidden sm:flex">
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {bookingsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted/50 animate-pulse rounded-md" />)}
                </div>
              ) : recentBookings?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No recent bookings yet.</div>
              ) : (
                <div className="space-y-3">
                  {recentBookings?.map(booking => (
                    <div key={booking.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/10">
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{booking.customer?.fullName}</span>
                        <span className="text-xs text-muted-foreground">{booking.appointmentType?.title}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-medium">{format(new Date(booking.startTime), "MMM d, h:mm a")}</div>
                        <Badge
                          variant="outline"
                          className={`mt-1 text-xs ${
                            booking.status === "confirmed" ? "text-green-700 border-green-200 bg-green-50" :
                            booking.status === "pending" ? "text-amber-700 border-amber-200 bg-amber-50" :
                            booking.status === "cancelled" ? "text-red-700 border-red-200 bg-red-50" :
                            "text-muted-foreground"
                          }`}
                        >
                          {booking.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="lg:col-span-3 border-border shadow-sm">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Link href="/organiser/appointments/new">
                <Button className="w-full justify-start h-12" variant="outline">
                  <Calendar className="mr-3 h-5 w-5 text-primary" />
                  Add New Service
                </Button>
              </Link>
              <Link href="/organiser/bookings">
                <Button className="w-full justify-start h-12" variant="outline">
                  <Clock className="mr-3 h-5 w-5 text-primary" />
                  Manage Bookings
                </Button>
              </Link>
              <Link href="/organiser/business">
                <Button className="w-full justify-start h-12" variant="outline">
                  <Building2 className="mr-3 h-5 w-5 text-primary" />
                  Business Profile
                </Button>
              </Link>
              <Link href="/organiser/reports">
                <Button className="w-full justify-start h-12" variant="outline">
                  <BarChart3 className="mr-3 h-5 w-5 text-primary" />
                  View Reports
                </Button>
              </Link>
              <Link href="/organiser/appointments">
                <Button className="w-full justify-start h-12" variant="outline">
                  <Users className="mr-3 h-5 w-5 text-primary" />
                  All Services
                  {myApts && (
                    <Badge className="ml-auto">{myApts.length}</Badge>
                  )}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
