import { useState } from "react";
import { useApp } from "@/lib/store";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, UserCircle2 } from "lucide-react";
import generatedLogo from "@assets/generated_images/minimalist_geometric_construction_logo.png";

export default function AuthPage() {
  const { login, users } = useApp();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("admin@panca.test");
  const [password, setPassword] = useState("password");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate network delay
    setTimeout(async () => {
      const result = await login(email);
      if (result) {
        if (result.role === "admin") setLocation("/admin");
        else if (result.role === "finance") setLocation("/finance");
        else setLocation("/employee");
      }
      setIsLoading(false);
    }, 800);
  };

  const fillCredentials = (role: "admin" | "employee" | "finance") => {
    if (role === "admin") {
      setEmail("admin@panca.test");
    } else if (role === "finance") {
      setEmail("finance@panca.test");
    } else {
      setEmail("budi@panca.test");
    }
    setPassword("password");
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-8">
      <div className="text-center space-y-2">
        <img 
          src={generatedLogo} 
          alt="Panca Karya Utama" 
          className="w-20 h-20 mx-auto rounded-xl shadow-lg mb-6 bg-white object-contain p-2"
        />
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-display">
          PT Panca Karya Utama
        </h1>
        <p className="text-slate-500">
          Construction Payroll & HRIS System
        </p>
      </div>

      <Card className="border-slate-200 shadow-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
          <CardDescription>
            Enter your email to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="name@company.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
            <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6">
             <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-500">Quick Login (Demo)</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4">
                <Button variant="outline" onClick={() => fillCredentials("admin")} className="flex items-center gap-1 text-xs px-2">
                  <Building2 className="w-3 h-3" /> Admin
                </Button>
                <Button variant="outline" onClick={() => fillCredentials("employee")} className="flex items-center gap-1 text-xs px-2">
                  <UserCircle2 className="w-3 h-3" /> Employee
                </Button>
                <Button variant="outline" onClick={() => fillCredentials("finance")} className="flex items-center gap-1 text-xs px-2">
                  <Building2 className="w-3 h-3" /> Finance
                </Button>
              </div>
          </div>
        </CardContent>
      </Card>
      
      <p className="text-center text-xs text-slate-400">
        &copy; 2025 PT Panca Karya Utama. All rights reserved.
      </p>
    </div>
  );
}
