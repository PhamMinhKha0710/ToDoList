import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ShieldCheck, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function ChangePasswordForm() {
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
  });

  const onSubmit = (data: PasswordFormValues) => {
    console.log("Password Data:", data);
    // Submit password change logic here
  };

  const newPassword = watch("newPassword", "");

  // Basic password strength logic
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { label: "", color: "bg-slate-200", text: "" };
    if (pass.length < 6) return { label: "Weak", color: "bg-red-400", text: "text-red-500" };
    if (pass.length < 10) return { label: "Medium", color: "bg-amber-400", text: "text-amber-500" };
    return { label: "Strong", color: "bg-emerald-500", text: "text-emerald-500" };
  };

  const strength = getPasswordStrength(newPassword);

  return (
    <Card className="shadow-sm border-slate-200">
      <CardHeader>
        <CardTitle className="text-xl text-slate-900 flex items-center gap-2">
          <ShieldCheck className="text-indigo-600" size={24} />
          Security Options
        </CardTitle>
        <CardDescription>Manage your password and authentication methods.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        
        {/* Password Section */}
        <div className="space-y-4 border rounded-xl p-5 border-slate-100 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center">
            <div>
              <h4 className="font-medium text-slate-900 text-sm">Change Password</h4>
              <p className="text-sm text-slate-500">Update your account password</p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setIsChangingPassword(!isChangingPassword)}
              className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-700"
            >
              <KeyRound className="w-4 h-4 mr-2" />
              {isChangingPassword ? "Cancel" : "Change Password"}
            </Button>
          </div>

          <div className={`grid transition-all duration-300 ease-in-out ${isChangingPassword ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0'}`}>
            <div className="overflow-hidden">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input 
                    id="currentPassword" 
                    type="password" 
                    {...register("currentPassword")} 
                    className="bg-white focus-visible:ring-indigo-500" 
                  />
                  {errors.currentPassword && <p className="text-xs text-red-500">{errors.currentPassword.message}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input 
                    id="newPassword" 
                    type="password" 
                    {...register("newPassword")} 
                    className="bg-white focus-visible:ring-indigo-500" 
                  />
                  {errors.newPassword && <p className="text-xs text-red-500">{errors.newPassword.message}</p>}
                  
                  {/* Strength Meter */}
                  {newPassword && (
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex-1 flex gap-1 h-1.5">
                        <div className={`flex-1 rounded-full ${strength.color}`}></div>
                        <div className={`flex-1 rounded-full ${strength.label === 'Medium' || strength.label === 'Strong' ? strength.color : 'bg-slate-200'}`}></div>
                        <div className={`flex-1 rounded-full ${strength.label === 'Strong' ? strength.color : 'bg-slate-200'}`}></div>
                      </div>
                      <span className={`text-xs font-medium w-12 text-right ${strength.text}`}>
                        {strength.label}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input 
                    id="confirmPassword" 
                    type="password" 
                    {...register("confirmPassword")} 
                    className="bg-white focus-visible:ring-indigo-500" 
                  />
                  {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
                </div>

                <div className="pt-2">
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white w-full sm:w-auto">
                    Update Password
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* 2FA Section */}
        <div className="flex items-start sm:items-center justify-between gap-4 p-5 rounded-xl border border-slate-100 bg-white shadow-sm">
          <div className="space-y-1">
            <h4 className="font-medium text-slate-900 flex items-center gap-2">
              Two-Factor Authentication (2FA)
              {is2FAEnabled && <span className="text-[10px] font-bold tracking-wider uppercase bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Active</span>}
            </h4>
            <p className="text-sm text-slate-500">
              Add an extra layer of security to your account.
            </p>
          </div>
          
          {/* Custom Toggle Switch */}
          <button
            type="button"
            role="switch"
            aria-checked={is2FAEnabled}
            onClick={() => setIs2FAEnabled(!is2FAEnabled)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${
              is2FAEnabled ? 'bg-indigo-600' : 'bg-slate-200'
            }`}
          >
            <span
              aria-hidden="true"
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                is2FAEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

      </CardContent>
    </Card>
  );
}
