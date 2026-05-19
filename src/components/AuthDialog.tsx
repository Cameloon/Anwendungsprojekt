import { useEffect, useState } from "react";
import { SignIn, SignUp, useUser } from "@clerk/clerk-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IS_DEMO, demoStore } from "@/lib/demoMode";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DemoAuthForm = ({ onDone }: { onDone: () => void }) => {
  const [email, setEmail] = useState("demo@dhbw.de");
  const [name, setName] = useState("Demo Student");
  return (
    <div className="space-y-4 p-2">
      <div className="space-y-2">
        <Label htmlFor="demo-name">Anzeigename</Label>
        <Input id="demo-name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="demo-email">E-Mail</Label>
        <Input id="demo-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <Button
        className="w-full"
        onClick={() => {
          demoStore.signIn(email, name);
          onDone();
        }}
      >
        Im Demo-Modus anmelden
      </Button>
      <p className="text-[11px] text-muted-foreground text-center">
        Demo-Modus aktiv — Daten werden nur lokal im Browser gespeichert.
      </p>
    </div>
  );
};

const ClerkAuthForm = ({ onDone }: { onDone: () => void }) => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const { isSignedIn } = useUser();
  useEffect(() => {
    if (isSignedIn) onDone();
  }, [isSignedIn, onDone]);
  return (
    <div className="flex flex-col items-center gap-3 pt-2">
      {mode === "login" ? (
        <SignIn routing="virtual" signUpUrl="#" appearance={{ elements: { footer: { display: "none" } } }} />
      ) : (
        <SignUp routing="virtual" signInUrl="#" appearance={{ elements: { footer: { display: "none" } } }} />
      )}
      <button
        type="button"
        onClick={() => setMode(mode === "login" ? "signup" : "login")}
        className="text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
      >
        {mode === "login" ? "Noch kein Account? Registrieren" : "Schon registriert? Anmelden"}
      </button>
    </div>
  );
};

const AuthDialog = ({ open, onOpenChange }: AuthDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{IS_DEMO ? "Demo-Anmeldung" : "Anmelden"}</DialogTitle>
          <DialogDescription className="sr-only">
            Melde dich an, um auf alle Funktionen zuzugreifen.
          </DialogDescription>
        </DialogHeader>
        {IS_DEMO ? (
          <DemoAuthForm onDone={() => onOpenChange(false)} />
        ) : (
          <ClerkAuthForm onDone={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AuthDialog;
