import { useGetDashboardStats, useListUsers, useListBusinesses } from "@workspace/api-client-react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, Clock, Activity, Building2, TrendingUp } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: users, isLoading: usersLoading } = useListUsers();
  const { data: businesses, isLoading: bizsLoading } = useListBusinesses();

  const statCards = [
    { title: "Total Users", value: stats?.totalUsers || 0, icon: Users, desc: "Registered accounts" },
    { title: "Businesses", value: stats?.totalBusinesses || 0, icon: Building2, desc: "Registered companies" },
    { title: "Services", value: stats?.totalAppointmentTypes || 0, icon: Calendar, desc: "Appointment types" },
    { title: "Total Bookings", value: stats?.totalBookings || 0, icon: Clock, desc: "All time" },
    { title: "Confirmed", value: stats?.confirmedBookings || 0, icon: TrendingUp, desc: "Successful bookings" },
    { title: "Providers", value: stats?.totalOrganisers || 0, icon: Activity, desc: "Business owners" },
  ];

  return (
    <MainLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">BookSlot platform overview and key metrics.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {statCards.map((card, i) => (
            <Card key={i} className="border-border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
                <card.icon className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                ) : (
                  <>
                    <div className="text-3xl font-bold">{card.value}</div>
                    <p className="text-xs text-muted-foreground mt-1">{card.desc}</p>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Businesses */}
          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Registered Businesses</CardTitle>
              <Link href="/admin/businesses">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {bizsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <div key={i} className="h-12 bg-muted/50 animate-pulse rounded" />)}
                </div>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Business</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {businesses?.slice(0, 5).map((biz) => (
                        <TableRow key={biz.id}>
                          <TableCell className="font-medium">{biz.name}</TableCell>
                          <TableCell className="capitalize text-sm text-muted-foreground">
                            {biz.category?.replace(/_/g, " ")}
                          </TableCell>
                          <TableCell>
                            <Badge variant={biz.isActive ? "default" : "secondary"}>
                              {biz.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Users */}
          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recently Joined Users</CardTitle>
              <Link href="/admin/users">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <div key={i} className="h-12 bg-muted/50 animate-pulse rounded" />)}
                </div>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users?.slice(0, 5).map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{user.fullName}</p>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="capitalize">{user.role}</TableCell>
                          <TableCell>
                            <Badge variant={user.isActive ? "default" : "secondary"}>
                              {user.isActive ? "Active" : "Inactive"}
                            </Badge>
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
      </div>
    </MainLayout>
  );
}
