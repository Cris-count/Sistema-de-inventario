import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { InventarioService } from '../../core/api/inventario.service';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  template: `
    <div class="page stack">
      <div>
        <h1>Panel</h1>
        <p class="muted">
          Usuario: <strong>{{ auth.user()?.email }}</strong>
          — Use el menú lateral para operar. La seguridad efectiva la define el API (JWT + roles).
        </p>
      </div>
      <div class="row">
        <div class="card" style="flex:1; min-width:200px">
          <h2>Existencias (registros)</h2>
          @if (loading()) {
            <p><span class="spinner"></span></p>
          } @else {
            <p class="stat">{{ totalInventario() }}</p>
            <a routerLink="/app/inventario">Ver inventario</a>
          }
        </div>
        <div class="card" style="flex:1; min-width:200px">
          <h2>Alertas stock mínimo</h2>
          @if (loading()) {
            <p><span class="spinner"></span></p>
          } @else {
            <p class="stat">{{ alertasCount() }}</p>
            <a routerLink="/app/inventario">Consultar en vista inventario / alertas</a>
          }
        </div>
      </div>
      <div class="card">
        <h2>Flujo sugerido (negocio)</h2>
        <ol class="muted" style="margin:0; padding-left:1.25rem">
          <li>Maestros: categorías, productos, bodegas (según rol).</li>
          <li>Stock inicial (solo administrador).</li>
          <li>Entradas, salidas, transferencias o ajustes.</li>
          <li>Consulta de inventario y reportes (kardex / CSV).</li>
        </ol>
      </div>
    </div>
  `,
  styles: `
    .stat {
      font-size: 2rem;
      font-weight: 700;
      margin: 0.5rem 0;
      color: var(--accent);
    }
  `
})
export class DashboardPage implements OnInit {
  readonly auth = inject(AuthService);
  private readonly inventarioApi = inject(InventarioService);

  readonly loading = signal(true);
  readonly totalInventario = signal(0);
  readonly alertasCount = signal(0);

  ngOnInit(): void {
    let pending = 2;
    const done = (): void => {
      pending--;
      if (!pending) this.loading.set(false);
    };
    this.inventarioApi
      .list(0, 1)
      .pipe(finalize(done))
      .subscribe({
        next: (p) => this.totalInventario.set(p.totalElements),
        error: () => this.totalInventario.set(0)
      });
    this.inventarioApi
      .alertas()
      .pipe(finalize(done))
      .subscribe({
        next: (a) => this.alertasCount.set(a.length),
        error: () => this.alertasCount.set(0)
      });
  }
}
