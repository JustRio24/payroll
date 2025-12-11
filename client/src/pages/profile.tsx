import { useState } from "react";
import { useApp } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserCircle } from "lucide-react";

export default function ProfilePage() {
  const { user, updateUser } = useApp();
  const [name, setName] = useState(user?.name || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  if (!user) return null;

  const handleUpdate = () => {
    if (password && password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    
    const updates: any = { name };
    if (password) updates.password = password;
    
    updateUser(user.id, updates);
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-display">My Profile</h2>
        <p className="text-slate-500">Manage your account settings</p>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your personal details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20 border-2 border-slate-100">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="bg-orange-100 text-orange-700 text-2xl">
                {user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <Button variant="outline" size="sm">Change Avatar</Button>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} />
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label>Email</Label>
                 <Input value={user.email} disabled className="bg-slate-50" />
               </div>
               <div className="space-y-2">
                 <Label>Role</Label>
                 <Input value={user.role} disabled className="capitalize bg-slate-50" />
               </div>
            </div>

            <div className="space-y-2">
                 <Label>Position</Label>
                 <Input value={user.position} disabled className="bg-slate-50" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>Change your password</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>New Password</Label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Confirm New Password</Label>
            <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
          </div>
          
          <div className="pt-4">
            <Button onClick={handleUpdate} className="bg-slate-900">
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
