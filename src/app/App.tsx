import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { EventsScreen } from './components/EventsScreen';
import { MainLayout } from './components/MainLayout';
import { HomeScreen } from './components/HomeScreen';
import { ParticipantsScreen } from './components/ParticipantsScreen';
import { QRScreen } from './components/QRScreen';
import { ChatScreen } from './components/ChatScreen';
import { ChatConversationScreen } from './components/ChatConversationScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { OtherUserProfile } from './components/OtherUserProfile';
import { InfoScreen } from './components/InfoScreen';
import { GalleryScreen } from './components/GalleryScreen';
import { CalendarScreen } from './components/CalendarScreen';
import { NetworkScreen } from './components/NetworkScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { FeedbackScreen } from './components/FeedbackScreen';
import { MasterProfileScreen } from './components/MasterProfileScreen';
import { LoginScreen } from './components/LoginScreen';
import { OnboardingScreen } from './components/OnboardingScreen';
import { EventPeriodProvider } from './components/eventPeriodContext';

export default function App() {
  return (
    <EventPeriodProvider>
      <BrowserRouter>
        <div className="h-screen w-screen bg-white overflow-hidden">
          <Routes>
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/welcome" element={<OnboardingScreen />} />
          <Route path="/me" element={<MasterProfileScreen />} />
          <Route path="/events" element={<EventsScreen />} />
          <Route path="/event/:eventId/chat/:chatId" element={<ChatConversationScreen />} />
          <Route path="/event/:eventId/user/:userId" element={<OtherUserProfile />} />
          <Route path="/event/:eventId/settings" element={<SettingsScreen />} />
          <Route path="/event/:eventId/feedback" element={<FeedbackScreen />} />
          <Route path="/event/:eventId/*" element={<MainLayout />}>
            <Route path="home" element={<HomeScreen />} />
            <Route path="participants" element={<ParticipantsScreen />} />
            <Route path="qr" element={<QRScreen />} />
            <Route path="chat" element={<ChatScreen />} />
            <Route path="profile" element={<ProfileScreen />} />
            <Route path="info" element={<InfoScreen />} />
            <Route path="gallery" element={<GalleryScreen />} />
            <Route path="calendar" element={<CalendarScreen />} />
            <Route path="network" element={<NetworkScreen />} />
            <Route index element={<Navigate to="home" replace />} />
          </Route>
          <Route path="/" element={<Navigate to="/events" replace />} />
        </Routes>
        </div>
      </BrowserRouter>
    </EventPeriodProvider>
  );
}