import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useVerifyOtp } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/auth-context";
import { AuthLayout } from "@/components/layout/auth-layout";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const verifyOtpSchema = z.object({
  otp: z.string().length(6, { message: "OTP must be 6 digits" }),
});

type VerifyOtpFormValues = z.infer<typeof verifyOtpSchema>;

export default function VerifyOtp() {
  const [location, setLocation] = useLocation();
  const { setUser } = useAuth();
  const verifyOtpMutation = useVerifyOtp();
  const [error, setError] = useState<string | null>(null);
  
  const searchParams = new URLSearchParams(window.location.search);
  const email = searchParams.get("email") || "";

  useEffect(() => {
    if (!email) {
      setLocation("/login");
    }
  }, [email, setLocation]);

  const form = useForm<VerifyOtpFormValues>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: {
      otp: "",
    },
  });

  const onSubmit = (data: VerifyOtpFormValues) => {
    setError(null);
    verifyOtpMutation.mutate(
      { data: { email, otp: data.otp } },
      {
        onSuccess: (res) => {
          setUser(res.user);
          if (res.user.role === "admin") {
            setLocation("/admin");
          } else if (res.user.role === "organiser") {
            setLocation("/organiser");
          } else {
            setLocation("/");
          }
        },
        onError: (err: any) => {
          setError(err?.message || "Invalid or expired OTP");
        },
      }
    );
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Check your email</h1>
          <p className="text-muted-foreground mt-2">
            We've sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="otp"
              render={({ field }) => (
                <FormItem className="flex flex-col items-center justify-center space-y-4">
                  <FormLabel className="sr-only">One-Time Password</FormLabel>
                  <FormControl>
                    <InputOTP maxLength={6} {...field}>
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={verifyOtpMutation.isPending || form.watch("otp").length !== 6}>
              {verifyOtpMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Account"
              )}
            </Button>
          </form>
        </Form>

        <div className="text-center text-sm text-muted-foreground">
          Didn't receive a code?{" "}
          <Link href="/login">
            <span className="text-primary font-medium hover:underline cursor-pointer">
              Back to login
            </span>
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
