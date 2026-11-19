import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html',
  styles: [`
    .auth-wrap {
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      background: radial-gradient(circle at 50% 15%, rgba(30, 58, 138, 0.3), transparent 70%), var(--bg-primary);
      padding: 1.5rem;
    }
    .auth-box { width: 100%; max-width: 420px; padding: 2.5rem 2rem; }
    .brand-row { text-align: center; margin-bottom: 2rem; display: flex; flex-direction: column; gap: 0.2rem; }
    .brand-name { font-size: 1.6rem; font-weight: 800; color: #ffffff; letter-spacing: -0.02em; }
    .brand-name .highlight { color: #38bdf8; }
    .brand-tagline { font-size: 0.75rem; color: var(--text-muted); }
    .alert-tag { margin-bottom: 1rem; padding: 0.5rem; justify-content: center; width: 100%; }
    .btn-submit { width: 100%; margin-top: 0.5rem; padding: 0.75rem; font-size: 0.9rem; }
    .auth-bottom { text-align: center; margin-top: 1.5rem; font-size: 0.8rem; color: var(--text-secondary); display: flex; justify-content: center; gap: 0.35rem; }
    .link { color: #38bdf8; font-weight: 600; text-decoration: none; }
  `]
})
export class RegisterComponent {
  auth = inject(AuthService);
  router = inject(Router);
  fullName = '';
  email = '';
  password = '';
  loading = false;
  errorMessage = '';

  onRegister() {
    this.errorMessage = '';
    this.loading = true;
    this.auth.register({
      full_name: this.fullName,
      email: this.email,
      password: this.password
    }).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/channels']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.detail || 'Erro ao realizar cadastro.';
      }
    });
  }
}
