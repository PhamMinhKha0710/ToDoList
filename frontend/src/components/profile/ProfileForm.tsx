import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Camera, Mail, BadgeCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const profileSchema = z.object({
  fullName: z.string().min(1, "Full Name is required").max(50, "Max 50 characters allowed"),
  displayName: z.string().min(1, "Display Name is required").max(50, "Max 50 characters allowed"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const DEFAULT_AVATARS = ["✨", "🔥", "🚀", "🌟", "🎨", "👽"];

export default function ProfileForm() {
  const [avatarPreview, setAvatarPreview] = useState<string>("✨");
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: "John Doe",
      displayName: "John",
    },
  });

  const onSubmit = (data: ProfileFormValues) => {
    console.log("Profile Data:", data);
    // Submit logic here
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsSavingAvatar(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
        setTimeout(() => setIsSavingAvatar(false), 800); // Simulate network
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectDefaultAvatar = (emoji: string) => {
    setIsSavingAvatar(true);
    setAvatarPreview(emoji);
    setTimeout(() => setIsSavingAvatar(false), 500);
  };

  const isEmoji = (str: string) => str.length <= 2;

  return (
    <Card className="shadow-sm border-slate-200">
      <CardHeader>
        <CardTitle className="text-xl text-slate-900">Basic Information</CardTitle>
        <CardDescription>Update your photo and personal details here.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        
        {/* Avatar Section */}
        <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
          <div className="relative">
            <Avatar className="w-24 h-24 border-4 border-white shadow-md">
              <AvatarFallback className="text-4xl bg-indigo-50 text-indigo-500">
                {isSavingAvatar ? <Loader2 className="animate-spin w-8 h-8" /> : (isEmoji(avatarPreview) ? avatarPreview : "JD")}
              </AvatarFallback>
              {!isEmoji(avatarPreview) && <AvatarImage src={avatarPreview} className="object-cover" />}
            </Avatar>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="absolute bottom-0 right-0 rounded-full w-8 h-8 shadow-sm border border-slate-200 hover:bg-slate-100"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSavingAvatar}
            >
              <Camera size={14} className="text-slate-600" />
            </Button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".jpg,.jpeg,.png" 
              onChange={handleAvatarChange}
            />
          </div>

          <div className="flex-1 space-y-2">
            <h4 className="text-sm font-medium text-slate-700 flex items-center gap-2">
              Default Avatars
              {isSavingAvatar && <span className="text-xs text-indigo-500 font-normal flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Saving...</span>}
            </h4>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_AVATARS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleSelectDefaultAvatar(emoji)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-xl bg-slate-50 border transition-all hover:scale-110 hover:shadow-sm ${avatarPreview === emoji ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200' : 'border-slate-200 hover:border-slate-300'}`}
                  disabled={isSavingAvatar}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500">Or upload a custom .jpg or .png image</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-slate-700">Full Name</Label>
              <Input 
                id="fullName" 
                placeholder="John Doe" 
                {...register("fullName")}
                className="focus-visible:ring-indigo-500 transition-shadow"
              />
              {errors.fullName && <p className="text-xs text-red-500">{errors.fullName.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-slate-700">Display Name</Label>
              <Input 
                id="displayName" 
                placeholder="John" 
                {...register("displayName")}
                className="focus-visible:ring-indigo-500 transition-shadow"
              />
              {errors.displayName && <p className="text-xs text-red-500">{errors.displayName.message}</p>}
            </div>
          </div>

          <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">
            Save Changes
          </Button>
        </form>

        <div className="pt-6 border-t border-slate-100">
          <div className="space-y-4">
            <div>
              <Label className="text-slate-700 mb-2 block">Email Address</Label>
              <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <Input 
                    value="john.doe@example.com" 
                    readOnly 
                    className="pl-9 bg-slate-50 text-slate-600 focus-visible:ring-0 border-slate-200 cursor-default"
                  />
                  <BadgeCheck className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" size={18} title="Verified" />
                </div>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setIsUpdatingEmail(!isUpdatingEmail)}
                  className="shrink-0 text-slate-700 hover:bg-slate-50"
                >
                  {isUpdatingEmail ? "Cancel" : "Update Email"}
                </Button>
              </div>
            </div>

            {isUpdatingEmail && (
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3 animate-in fade-in zoom-in-95 duration-200">
                <div className="space-y-2">
                  <Label htmlFor="newEmail" className="text-slate-700">New Email Address</Label>
                  <Input 
                    id="newEmail" 
                    type="email" 
                    placeholder="Enter new email" 
                    className="bg-white focus-visible:ring-indigo-500"
                  />
                </div>
                <Button type="button" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  Send Verification Link
                </Button>
              </div>
            )}
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
