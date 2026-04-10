import { Component, computed, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { NAV_ITEMS, navExactActive, navVisibleForRole } from '../../core/navigation';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="shell">
      <aside class="sidebar">
        <div class="brand">
          <strong>Inventario</strong>
          <span class="muted">multi-bodega</span>
        </div>
        <nav>
          @for (item of visibleNav(); track item.parts.join('/')) {
            <a
              [routerLink]="['/app', ...item.parts]"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: navExactActive(item) || item.parts[0] === 'dashboard' }"
 >
              {{ item.label }}
            </a>
          }
        </nav>
        <div class="user-box">
          @if (auth.user(); as u) {
            <div class="user-name">{{ u.nombre }}</div>
            <div class="muted">{{ u.rolNombre }} ({{ u.rolCodigo }})</div>
            <button type="button" class="btn btn-ghost logout" (click)="auth.logout()">Cerrar sesión</button>
          }
        </div>
      </aside>
      <div class="main-col">
        <router-outlet />
      </div>
    </div>
  `,
  styles: `
    .shell {
      display: flex;
      min-height: 100vh;
    }
    .sidebar {
      width: 240px;
      flex-shrink: 0;
      background: var(--surface);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      padding: 1rem 0;
    }
    .brand {
      padding: 0 1rem 1rem;
      border-bottom: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }
    nav {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 0.75rem 0;
      gap: 0.15rem;
    }
    nav a {
      padding: 0.45rem 1rem;
      color: var(--text);
      text-decoration: none;
      font-size: 0.9rem;
      border-left: 3px solid transparent;
    }
    nav a:hover {
      background: rgba(56, 189, 248, 0.08);
      text-decoration: none;
    }
    nav a.active {
      border-left-color: var(--accent);
      background: rgba(56, 189, 248, 0.12);
      color: var(--accent);
    }
    .user-box {
      padding: 1rem;
      border-top: 1px solid var(--border);
      font-size: 0.8rem;
    }
    .user-name {
      font-weight: 600;
    }
    .logout {
      margin-top: 0.75rem;
      width: 100%;
    }
    .main-col {
      flex: 1;
      padding: 1.5rem;
      overflow-x: auto;
    }
  `
})
export class AppShellComponent implements OnInit {
  readonly auth = inject(AuthService);
  readonly navExactActive = navExactActive;

  ngOnInit(): void {
    this.auth.refreshMe().subscribe({
      error: () => this.auth.logout()
    });
  }

  readonly visibleNav = computed(() => {
    const role = this.auth.role();
    return NAV_ITEMS.filter((i) => navVisibleForRole(role, i));
  });
}
