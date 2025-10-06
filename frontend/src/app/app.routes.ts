import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Register } from './components/register/register';
import { Chat } from './components/chat/chat';
import { AuthGuard } from './guards/auth-guard';

export const routes: Routes = [
  {
    path: 'login',
    component: Login,
  },
  {
    path: 'register',
    component: Register,
  },
  { path: 'chat', component: Chat, canActivate: [AuthGuard] },
  {
    path: '**',
    redirectTo: 'login',
    pathMatch: 'full',
  },
];
