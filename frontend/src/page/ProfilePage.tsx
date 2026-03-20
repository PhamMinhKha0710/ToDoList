import ProfileForm from "@/components/profile/ProfileForm";
import ChangePasswordForm from "@/components/profile/ChangePasswordForm";
import { User, Shield } from "lucide-react";

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 flex justify-center">
      <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row gap-8">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 flex flex-col gap-2 shrink-0">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-6">Settings</h1>
          <nav className="flex flex-col space-y-1">
            <a href="#basic-info" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-indigo-50 text-indigo-700 font-medium transition-colors">
              <User size={18} />
              Basic Information
            </a>
            <a href="#security" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors">
              <Shield size={18} />
              Security
            </a>
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col gap-8">
          <section id="basic-info" className="scroll-mt-8">
            <ProfileForm />
          </section>
          
          <section id="security" className="scroll-mt-8">
            <ChangePasswordForm />
          </section>
        </div>

      </div>
    </div>
  );
}

