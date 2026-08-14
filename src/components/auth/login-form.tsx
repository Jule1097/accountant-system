"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "src/components/ui/button";
import { Input } from "src/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "src/components/ui/card";
import { useAuth } from "src/hooks/use-auth";

const loginSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
});

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await login(values.email, values.password);
      router.push("/dashboard");
    } catch {
      setErrorMsg("Credenciales inválidas. Por favor verifique e intente nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-[384px] [--card-spacing:24px] !bg-white dark:!bg-zinc-950 border border-zinc-200 dark:border-zinc-800 !ring-0 !shadow-none text-foreground">
      <CardHeader className="gap-1.5">
        <CardTitle className="text-2xl font-semibold text-zinc-900 dark:text-white">Iniciar Sesión</CardTitle>
        <CardDescription className="text-sm text-zinc-500 dark:text-zinc-400">
          Ingresa tu email para acceder a tu cuenta.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          {errorMsg && (
            <p className="text-sm font-medium text-destructive">{errorMsg}</p>
          )}
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Email
            </label>
            <Input
              id="email"
              placeholder="m@example.com"
              disabled={isSubmitting}
              className="h-10 text-sm px-3 !bg-transparent !border-zinc-200 dark:!border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm font-medium text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Contraseña
            </label>
            <Input
              id="password"
              type="password"
              disabled={isSubmitting}
              className="h-10 text-sm px-3 !bg-transparent !border-zinc-200 dark:!border-zinc-800 text-zinc-900 dark:text-zinc-100"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm font-medium text-destructive">{errors.password.message}</p>
            )}
          </div>
          <Button
            type="submit"
            className="w-full h-10 !bg-[#FF5C00] hover:!bg-[#FF5C00]/90 !text-white text-sm font-medium rounded-md"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Ingresando..." : "Ingresar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
