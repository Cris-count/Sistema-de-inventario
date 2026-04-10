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
      <header class="page-header">
        <h1>Panel de control</h1>
               <p class="page-lead">
          Bienvenido, <strong>{{ auth.user()?.nombre }}</strong>
          <span class="muted"> · {{ auth.user()?.email }}</span>
        </p>
        <p class="page-lead" style="margin-top:0.5rem">
          Use el menú lateral para las operaciones del día. Los permisos los aplica el servidor según su rol (JWT).
        </p>
      </header>

      <section class="kpi-grid" aria-label="Resumen">
        <div class="card kpi-card">
          <h2>Existencias registradas</h2>
          @if (loading()) {
            <p><span class="spinner"></span></p>
          } @else {
            <p class="stat">{{ totalInventario() }}</p>
            <a routerLink="/app/inventario">Ir al inventario →</a>
          }
        </div>
        <div class="card kpi-card">
          <h2>Alertas bajo mínimo</h2>
          @if (loading()) {
            <p><span class="spinner"></span></p>
          } @else {
            <p class="stat">{{ alertasCount() }}</p>
            <a routerLink="/app/inventario">Revisar en vista inventario →</a>
          }
        </div>
      </section>

      <section class="card" aria-label="Flujo de trabajo sugerido">
        <h2>Flujo de trabajo recomendado</h2>
        <ol class="flow-list">
          <li>Configurar maestros: categorías, productos y bodegas (según su rol).</li>
          <li>Cargar stock inicial (solo administración).</li>
          <li>Registrar entradas, salidas, transferencias o ajustes.</li>
          <li>Consultar existencias y reportes (kardex, exportación).</li>
        </ol>
      </section>
    </div>
  `,
  styles: []
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
