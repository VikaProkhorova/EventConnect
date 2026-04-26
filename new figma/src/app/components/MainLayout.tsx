import { Outlet, useNavigate, useLocation, useParams } from 'react-router';
import { Home, Users, QrCode, MessageCircle, UserCircle } from 'lucide-react';

export function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { eventId } = useParams();

  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'participants', icon: Users, label: 'Participants' },
    { id: 'qr', icon: QrCode, label: 'QR' },
    { id: 'chat', icon: MessageCircle, label: 'Chat' },
    { id: 'profile', icon: UserCircle, label: 'Profile' },
  ];

  const pathParts = location.pathname.split('/');
  const currentTab = pathParts[pathParts.length - 1] || 'home';

  return (
    <div className="h-full w-full flex flex-col bg-white">
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>

      <nav className="border-t bg-white">
        <div className="flex items-center justify-around py-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => navigate(`/event/${eventId}/${tab.id}`)}
                className="flex flex-col items-center gap-1 py-1 px-3 min-w-[60px]"
              >
                <Icon
                  className={`w-6 h-6 ${
                    isActive ? 'text-blue-600' : 'text-gray-400'
                  }`}
                />
                <span
                  className={`text-xs ${
                    isActive ? 'text-blue-600 font-medium' : 'text-gray-500'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}