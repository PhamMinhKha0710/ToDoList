import { useLocation } from "react-router-dom";
import ProfileForm from "@/components/profile/ProfileForm";
import ChangePasswordForm from "@/components/profile/ChangePasswordForm";
import { User, Shield } from "lucide-react";

export default function ProfilePage() {
  const location = useLocation();
  const activeTab = location.hash === "#security" ? "security" : "basic-info";

  return (
    <div className="h-full w-full overflow-y-auto bg-background p-4 md:p-8 flex justify-center">
      <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row gap-8 min-h-min">

        {/* Sidebar */}
        <div className="w-full md:w-64 flex flex-col gap-2 shrink-0">
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-6">Cài đặt</h1>
          <nav className="flex flex-col space-y-1">
            <a 
              href="#basic-info" 
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
                activeTab === "basic-info" 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <User size={18} />
              Thông tin cơ bản
            </a>
            <a 
              href="#security" 
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
                activeTab === "security" 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Shield size={18} />
              Bảo mật
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
