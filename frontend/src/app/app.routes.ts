import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { LayoutComponent } from './layout/layout.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ChannelsComponent } from './pages/channels/channels.component';
import { DestinationsComponent } from './pages/destinations/destinations.component';
import { WhatsappComponent } from './pages/whatsapp/whatsapp.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { TesterComponent } from './pages/tester/tester.component';
import { AnalyticsComponent } from './pages/analytics/analytics.component';
import { LogsComponent } from './pages/logs/logs.component';
import { CookiesComponent } from './pages/cookies/cookies.component';
import { VitrineComponent } from './pages/vitrine/vitrine.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'channels', component: ChannelsComponent },
      { path: 'whatsapp', component: WhatsappComponent },
      { path: 'destinations', component: WhatsappComponent },
      { path: 'cookies', component: CookiesComponent },
      { path: 'vitrine', component: VitrineComponent },
      { path: 'settings', component: SettingsComponent },
      { path: 'tester', component: TesterComponent },
      { path: 'analytics', component: AnalyticsComponent },
      { path: 'logs', component: LogsComponent },
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
