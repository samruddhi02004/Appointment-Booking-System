import { ReactNode } from "react";
import { Link } from "wouter";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full flex bg-background">
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="mb-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <div className="w-4 h-4 rounded-sm border-2 border-primary-foreground" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-foreground">BookSlot</span>
            </Link>
          </div>
          {children}
        </div>
      </div>
      <div className="hidden lg:block relative w-0 flex-1">
        <div className="absolute inset-0 bg-primary h-full w-full overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary-foreground/10 via-transparent to-transparent" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-foreground/5 rounded-full blur-3xl" />
          <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-primary-foreground">
            <h2 className="text-4xl font-bold mb-4 tracking-tight max-w-lg text-center">Precision scheduling for professionals.</h2>
            <p className="text-lg opacity-80 max-w-md text-center">Manage appointments, automate availability, and provide a seamless booking experience for your clients.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
