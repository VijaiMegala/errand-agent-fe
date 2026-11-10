"use client";

import { FormEvent, useState } from "react";
import { Alert, Box, Button, Dialog, DialogContent, IconButton, TextField, Typography } from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import { login, register } from "@/lib/api";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: (accessToken: string, email: string, expiresIn: number) => Promise<void>;
  registrationRole?: "customer" | "service_provider";
};

export function AuthDialog({ open, onClose, onSuccess, registrationRole = "customer" }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (mode === "register") await register(name.trim(), email.trim(), password, registrationRole);
      const result = await login(email.trim(), password);
      await onSuccess(result.accessToken, email.trim(), result.expiresIn);
      setPassword("");
      onClose();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" slotProps={{ paper: { sx: { borderRadius: "28px", p: 1 } } }}>
      <DialogContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Box sx={{ width: 46, height: 46, display: "grid", placeItems: "center", bgcolor: "#e4f3eb", color: "#2e8e82", borderRadius: "15px" }}>
            <AutoAwesomeRoundedIcon />
          </Box>
          <IconButton aria-label="Close" onClick={onClose} size="small"><CloseRoundedIcon /></IconButton>
        </Box>
        <Typography variant="h5" sx={{ mt: 2.5, fontWeight: 800, letterSpacing: "-.7px" }}>
          {mode === "login" ? "Welcome back" : "Make yourself at home"}
        </Typography>
        <Typography sx={{ mt: 1, mb: 2.5, fontSize: 13, color: "#81918d", lineHeight: 1.6 }}>
          {mode === "login" ? "Sign in to your Homie account." : registrationRole === "customer" ? "Create a customer account to chat with Homie." : "Create a provider account to manage your services."}
        </Typography>
        <Box component="form" onSubmit={submit} sx={{ display: "grid", gap: 1.7 }}>
          {mode === "register" && (
            <TextField label="Full name" required value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" size="small" />
          )}
          <TextField label="Email address" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" size="small" />
          <TextField label="Password" type="password" required value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} size="small" helperText={mode === "register" ? "Use 8 to 16 characters." : undefined} />
          {error && <Alert severity="error" sx={{ borderRadius: "14px", fontSize: 12 }}>{error}</Alert>}
          <Button type="submit" variant="contained" disabled={submitting} sx={{ mt: .5, py: 1.35, borderRadius: "14px", textTransform: "none", fontWeight: 800, boxShadow: "none" }}>
            {submitting ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
          </Button>
        </Box>
        <Typography sx={{ mt: 2.3, fontSize: 12, color: "#899a94", textAlign: "center" }}>
          {mode === "login" ? "New here?" : "Already have an account?"}{" "}
          <Button variant="text" size="small" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }} sx={{ textTransform: "none", fontWeight: 800, p: 0, minWidth: 0 }}>
            {mode === "login" ? registrationRole === "customer" ? "Create a customer account" : "Create a provider account" : "Sign in"}
          </Button>
        </Typography>
      </DialogContent>
    </Dialog>
  );
}
