import { useState, useEffect } from "react";
import { Link, useLocation, useParams } from "wouter";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { getGetAppointmentQueryKey, useCreateAppointment, useGetAppointment, useUpdateAppointment, useGetMyBusiness } from "@workspace/api-client-react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const daySchema = z.object({
  enabled: z.boolean().default(false),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
});

const formSchema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().optional(),
  duration: z.coerce.number().min(5, "Minimum duration is 5 mins"),
  scheduleType: z.enum(["weekly", "flexible"]),
  manageCapacity: z.boolean().default(false),
  maxCapacity: z.coerce.number().optional(),
  advancePayment: z.boolean().default(false),
  paymentAmount: z.coerce.number().optional(),
  manualConfirmation: z.boolean().default(false),
  location: z.string().optional(),
  workingHours: z.object({
    monday: daySchema,
    tuesday: daySchema,
    wednesday: daySchema,
    thursday: daySchema,
    friday: daySchema,
    saturday: daySchema,
    sunday: daySchema,
  }).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function AppointmentForm() {
  const [location, setLocation] = useLocation();
  const { appointmentId } = useParams();
  const isEdit = !!appointmentId;
  const appointmentIdNum = appointmentId ? Number(appointmentId) : 0;
  const { toast } = useToast();

  const { data: myBusiness } = useGetMyBusiness();

  const { data: existingAppointment, isLoading: isLoadingExisting } = useGetAppointment(appointmentIdNum, {
    query: { queryKey: getGetAppointmentQueryKey(appointmentIdNum), enabled: isEdit }
  });

  const createMutation = useCreateAppointment();
  const updateMutation = useUpdateAppointment();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      duration: 30,
      scheduleType: "weekly",
      manageCapacity: false,
      advancePayment: false,
      manualConfirmation: false,
      location: "",
      workingHours: {
        monday: { enabled: true, startTime: "09:00", endTime: "17:00" },
        tuesday: { enabled: true, startTime: "09:00", endTime: "17:00" },
        wednesday: { enabled: true, startTime: "09:00", endTime: "17:00" },
        thursday: { enabled: true, startTime: "09:00", endTime: "17:00" },
        friday: { enabled: true, startTime: "09:00", endTime: "17:00" },
        saturday: { enabled: false, startTime: "10:00", endTime: "14:00" },
        sunday: { enabled: false, startTime: "10:00", endTime: "14:00" },
      }
    },
  });

  const manageCapacity = form.watch("manageCapacity");
  const advancePayment = form.watch("advancePayment");

  useEffect(() => {
    if (existingAppointment) {
      form.reset({
        title: existingAppointment.title,
        description: existingAppointment.description || "",
        duration: existingAppointment.duration,
        scheduleType: existingAppointment.scheduleType,
        manageCapacity: existingAppointment.manageCapacity,
        maxCapacity: existingAppointment.maxCapacity || undefined,
        advancePayment: existingAppointment.advancePayment,
        paymentAmount: existingAppointment.paymentAmount || undefined,
        manualConfirmation: existingAppointment.manualConfirmation,
        location: existingAppointment.location || "",
        workingHours: existingAppointment.workingHours || form.getValues().workingHours,
      });
    }
  }, [existingAppointment, form]);

  const onSubmit = (data: FormValues) => {
    const payload = {
      ...data,
      maxCapacity: data.manageCapacity ? data.maxCapacity : undefined,
      paymentAmount: data.advancePayment ? data.paymentAmount : undefined,
    };

    if (isEdit) {
      updateMutation.mutate(
        { appointmentId: Number(appointmentId), data: payload },
        {
          onSuccess: () => {
            toast({ title: "Appointment updated successfully" });
            setLocation("/organiser/appointments");
          }
        }
      );
    } else {
      if (!myBusiness) {
        toast({ title: "Set up your business first", description: "Go to My Business to create your business profile before adding services.", variant: "destructive" });
        setLocation("/organiser/business");
        return;
      }
      createMutation.mutate(
        { data: { ...payload, businessId: myBusiness.id } as any },
        {
          onSuccess: () => {
            toast({ title: "Service created successfully" });
            setLocation("/organiser/appointments");
          }
        }
      );
    }
  };

  if (isEdit && isLoadingExisting) {
    return (
      <MainLayout>
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </MainLayout>
    );
  }

  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/organiser/appointments")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{isEdit ? "Edit Appointment Type" : "New Appointment Type"}</h1>
            <p className="text-muted-foreground mt-1">Configure your service details and availability.</p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="w-full grid grid-cols-2 max-w-[400px]">
                <TabsTrigger value="general">General details</TabsTrigger>
                <TabsTrigger value="availability">Availability</TabsTrigger>
              </TabsList>
              
              <TabsContent value="general" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField control={form.control} name="title" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Title *</FormLabel>
                        <FormControl><Input placeholder="e.g. Initial Consultation" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    
                    <FormField control={form.control} name="description" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl><Textarea placeholder="Describe the service..." className="min-h-[100px]" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField control={form.control} name="duration" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration (minutes) *</FormLabel>
                          <FormControl><Input type="number" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      
                      <FormField control={form.control} name="location" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <FormControl><Input placeholder="Zoom link or physical address" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Booking Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField control={form.control} name="manualConfirmation" render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Require Manual Confirmation</FormLabel>
                          <FormDescription>You must approve bookings before they are confirmed.</FormDescription>
                        </div>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      </FormItem>
                    )} />

                    <div className="space-y-4">
                      <FormField control={form.control} name="manageCapacity" render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Group Session</FormLabel>
                            <FormDescription>Allow multiple people to book the same time slot.</FormDescription>
                          </div>
                          <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        </FormItem>
                      )} />
                      
                      {manageCapacity && (
                        <FormField control={form.control} name="maxCapacity" render={({ field }) => (
                          <FormItem className="pl-4 border-l-2 border-primary ml-2">
                            <FormLabel>Maximum Attendees</FormLabel>
                            <FormControl><Input type="number" {...field} value={field.value || ''} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      )}
                    </div>

                    <div className="space-y-4">
                      <FormField control={form.control} name="advancePayment" render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Require Payment</FormLabel>
                            <FormDescription>Set a price for this service.</FormDescription>
                          </div>
                          <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        </FormItem>
                      )} />
                      
                      {advancePayment && (
                        <FormField control={form.control} name="paymentAmount" render={({ field }) => (
                          <FormItem className="pl-4 border-l-2 border-primary ml-2">
                            <FormLabel>Amount ($)</FormLabel>
                            <FormControl><Input type="number" step="0.01" {...field} value={field.value || ''} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="availability" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Schedule Settings</CardTitle>
                    <CardDescription>Define when this service can be booked.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField control={form.control} name="scheduleType" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Schedule Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="weekly">Weekly Recurring Hours</SelectItem>
                            <SelectItem value="flexible">Flexible (Date-specific)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>How you want to define your availability.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {form.watch("scheduleType") === "weekly" && (
                      <div className="space-y-4 border rounded-lg p-4">
                        <h3 className="font-medium">Weekly Hours</h3>
                        <div className="space-y-3">
                          {days.map((day) => (
                            <div key={day} className="flex items-center gap-4">
                              <FormField control={form.control} name={`workingHours.${day}.enabled`} render={({ field }) => (
                                <FormItem className="flex items-center gap-2 w-32 space-y-0">
                                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                  <FormLabel className="capitalize m-0 font-normal cursor-pointer">{day}</FormLabel>
                                </FormItem>
                              )} />
                              
                              {form.watch(`workingHours.${day}.enabled`) ? (
                                <div className="flex items-center gap-2 flex-1">
                                  <FormField control={form.control} name={`workingHours.${day}.startTime`} render={({ field }) => (
                                    <FormItem className="flex-1 space-y-0"><FormControl><Input type="time" {...field} /></FormControl></FormItem>
                                  )} />
                                  <span className="text-muted-foreground">-</span>
                                  <FormField control={form.control} name={`workingHours.${day}.endTime`} render={({ field }) => (
                                    <FormItem className="flex-1 space-y-0"><FormControl><Input type="time" {...field} /></FormControl></FormItem>
                                  )} />
                                </div>
                              ) : (
                                <div className="text-sm text-muted-foreground italic flex-1">Unavailable</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-4 border-t pt-6">
              <Button type="button" variant="outline" onClick={() => setLocation("/organiser/appointments")}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? "Save Changes" : "Create Appointment"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </MainLayout>
  );
}
