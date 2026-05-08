import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { 
  getGetAppointmentQueryKey,
  getGetAvailableSlotsQueryKey,
  getListQuestionsQueryKey,
  useGetAppointment, 
  useGetAvailableSlots, 
  useListQuestions, 
  useCreateBooking 
} from "@workspace/api-client-react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ChevronRight, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function BookAppointment() {
  const { appointmentId } = useParams();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const appointmentIdNum = appointmentId ? Number(appointmentId) : 0;
  
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [capacity, setCapacity] = useState(1);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  
  const { data: appointment, isLoading: aptLoading } = useGetAppointment(appointmentIdNum, {
    query: { queryKey: getGetAppointmentQueryKey(appointmentIdNum), enabled: !!appointmentId }
  });

  const { data: slots, isLoading: slotsLoading } = useGetAvailableSlots(
    appointmentIdNum,
    { date: selectedDate ? format(selectedDate, "yyyy-MM-dd") : "" },
    {
      query: {
        queryKey: getGetAvailableSlotsQueryKey(appointmentIdNum, { date: selectedDate ? format(selectedDate, "yyyy-MM-dd") : "" }),
        enabled: !!appointmentId && !!selectedDate && step === 2,
      },
    }
  );

  const { data: questions } = useListQuestions(appointmentIdNum, {
    query: { queryKey: getListQuestionsQueryKey(appointmentIdNum), enabled: !!appointmentId && step === 4 }
  });

  const createBooking = useCreateBooking();

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const handleBook = () => {
    if (!selectedSlot) return;

    const formattedAnswers = Object.entries(answers).map(([qId, ans]) => ({
      questionId: Number(qId),
      answer: ans as string
    }));

    createBooking.mutate({
      data: {
        appointmentTypeId: Number(appointmentId),
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        capacity: appointment?.manageCapacity ? capacity : undefined,
        answers: formattedAnswers
      }
    }, {
      onSuccess: (booking) => {
        setLocation(`/booking-confirmation/${booking.id}`);
      },
      onError: (err: any) => {
        toast({
          title: "Booking failed",
          description: err.message || "An error occurred",
          variant: "destructive"
        });
      }
    });
  };

  if (aptLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!appointment) return <MainLayout>Appointment not found</MainLayout>;

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" onClick={() => setLocation("/")} className="mb-6 -ml-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Services
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold">{appointment.title}</h1>
          <p className="text-muted-foreground mt-2">{appointment.description}</p>
          
          <div className="flex gap-4 mt-4 text-sm font-medium">
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full">{appointment.duration} minutes</span>
            {appointment.advancePayment && (
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full">${appointment.paymentAmount}</span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mb-8 overflow-x-auto pb-4">
          {[
            { num: 1, label: "Date" },
            { num: 2, label: "Time" },
            { num: 3, label: "Capacity", hidden: !appointment.manageCapacity },
            { num: 4, label: "Details" },
            { num: 5, label: "Confirm" }
          ].filter(s => !s.hidden).map((s, i, arr) => (
            <div key={s.num} className="flex items-center min-w-max">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 font-medium
                ${step === s.num ? 'border-primary bg-primary text-primary-foreground' : 
                  step > s.num ? 'border-primary bg-primary/20 text-primary' : 'border-muted text-muted-foreground'}`}>
                {step > s.num ? <CheckCircle2 className="w-5 h-5" /> : s.num}
              </div>
              <span className={`ml-2 text-sm ${step === s.num ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                {s.label}
              </span>
              {i < arr.length - 1 && (
                <div className={`w-12 h-[2px] mx-4 ${step > s.num ? 'bg-primary' : 'bg-muted'}`} />
              )}
            </div>
          ))}
        </div>

        <Card className="border-border shadow-md">
          <CardContent className="p-6 md:p-8">
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Select a Date</h2>
                <div className="flex justify-center border rounded-lg p-4 bg-card">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date) {
                        setSelectedDate(date);
                        handleNext();
                      }
                    }}
                    disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                    className="p-3 pointer-events-auto"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Available Times for {selectedDate && format(selectedDate, "MMM d, yyyy")}</h2>
                  <Button variant="ghost" size="sm" onClick={handleBack}>Change Date</Button>
                </div>
                
                {slotsLoading ? (
                  <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                ) : slots?.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg">No available times on this date.</div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {slots?.map((slot, i) => (
                      <Button
                        key={i}
                        variant={selectedSlot === slot ? "default" : "outline"}
                        className={`h-auto py-3 ${selectedSlot === slot ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                        onClick={() => setSelectedSlot(slot)}
                      >
                        {format(new Date(slot.startTime), "h:mm a")}
                      </Button>
                    ))}
                  </div>
                )}
                
                <div className="flex justify-end mt-8 pt-4 border-t border-border">
                  <Button onClick={handleNext} disabled={!selectedSlot}>
                    Continue <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && appointment.manageCapacity && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Number of Attendees</h2>
                  <Button variant="ghost" size="sm" onClick={handleBack}>Back</Button>
                </div>
                
                <div className="max-w-xs mx-auto space-y-4">
                  <Label>How many people?</Label>
                  <Input 
                    type="number" 
                    min={1} 
                    max={appointment.maxCapacity || 10} 
                    value={capacity}
                    onChange={(e) => setCapacity(parseInt(e.target.value) || 1)}
                  />
                  <p className="text-xs text-muted-foreground">Maximum {appointment.maxCapacity} allowed.</p>
                </div>

                <div className="flex justify-end mt-8 pt-4 border-t border-border">
                  <Button onClick={handleNext}>
                    Continue <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {((step === 3 && !appointment.manageCapacity) || step === 4) && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Additional Details</h2>
                  <Button variant="ghost" size="sm" onClick={handleBack}>Back</Button>
                </div>
                
                {questions && questions.length > 0 ? (
                  <div className="space-y-6">
                    {questions.map((q) => (
                      <div key={q.id} className="space-y-2">
                        <Label>{q.question} {q.isRequired && <span className="text-destructive">*</span>}</Label>
                        <Input 
                          value={answers[q.id] || ""}
                          onChange={(e) => setAnswers({...answers, [q.id]: e.target.value})}
                          required={q.isRequired}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground py-8 text-center bg-muted/20 rounded-lg">No additional details required.</p>
                )}

                <div className="flex justify-end mt-8 pt-4 border-t border-border">
                  <Button onClick={handleNext}>
                    Review Booking <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {((step === 4 && !appointment.manageCapacity) || step === 5) && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Review & Confirm</h2>
                  <Button variant="ghost" size="sm" onClick={handleBack}>Back</Button>
                </div>
                
                <div className="bg-muted/30 p-6 rounded-lg space-y-4 border border-border">
                  <div className="flex justify-between border-b pb-4">
                    <span className="text-muted-foreground">Service</span>
                    <span className="font-medium text-right">{appointment.title}</span>
                  </div>
                  <div className="flex justify-between border-b pb-4">
                    <span className="text-muted-foreground">Date & Time</span>
                    <span className="font-medium text-right">
                      {selectedSlot && format(new Date(selectedSlot.startTime), "EEEE, MMM d, yyyy")}
                      <br />
                      {selectedSlot && `${format(new Date(selectedSlot.startTime), "h:mm a")} - ${format(new Date(selectedSlot.endTime), "h:mm a")}`}
                    </span>
                  </div>
                  {appointment.manageCapacity && (
                    <div className="flex justify-between border-b pb-4">
                      <span className="text-muted-foreground">Attendees</span>
                      <span className="font-medium">{capacity}</span>
                    </div>
                  )}
                  {appointment.advancePayment && appointment.paymentAmount && (
                    <div className="flex justify-between border-b pb-4">
                      <span className="text-muted-foreground">Total Due</span>
                      <span className="font-bold text-lg">${appointment.paymentAmount}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-end mt-8 pt-4 border-t border-border">
                  <Button 
                    onClick={handleBook} 
                    size="lg" 
                    className="w-full sm:w-auto"
                    disabled={createBooking.isPending}
                  >
                    {createBooking.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Confirm Booking
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
