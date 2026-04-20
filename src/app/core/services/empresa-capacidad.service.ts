import { inject, Injectable } from '@angular/core';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';
import type { EmpresaCapacidadSnapshot } from '../models/empresa-capacidad.model';
import type { PlanLimitsFromMiEmpresa } from '../models/plan-limits-snapshot.model';
import { BodegaService } from '../api/bodega.service';
import { ProductoService } from '../api/producto.service';
import { UsuarioService } from '../api/usuario.service';
import { PlanesService } from './planes.service';

const UI_NEAR_LIMIT_THRESHOLD = 80;

@Injectable({ providedIn: 'root' })
export class EmpresaCapacidadService {
  private readonly bodegaApi = inject(BodegaService);
  private readonly usuarioApi = inject(UsuarioService);
  private readonly productoApi = inject(ProductoService);
  private readonly planesApi = inject(PlanesService);

  /**
   * @param limitesDesdeMi Si viene de `GET /empresa/mi`, se usan estos límites (fuente de verdad)
   * y no hace falta resolver el plan público para cupos.
   */
  getSnapshot(planCodigo: string | null, limitesDesdeMi?: PlanLimitsFromMiEmpresa | null): Observable<EmpresaCapacidadSnapshot> {
    const plan$ =
      limitesDesdeMi != null
        ? of(null)
        : this.planesApi.listPublicPlanes().pipe(
            map((plans) => (planCodigo ? plans.find((p) => p.codigo === planCodigo || p.id === planCodigo) ?? null : null)),
            catchError(() => of(null))
          );

    const bodegas$ = this.bodegaApi.list().pipe(
      map((rows) => rows.length),
      catchError(() => of<number | null>(null))
    );

    const usuarios$ = this.usuarioApi.list(0, 1).pipe(
      map((page) => page.totalElements),
      catchError(() => of<number | null>(null))
    );

    const productos$ = this.productoApi.list(0, 1).pipe(
      map((page) => page.totalElements),
      catchError(() => of<number | null>(null))
    );

    return forkJoin({
      plan: plan$,
      bodegas: bodegas$,
      usuarios: usuarios$,
      productos: productos$
    }).pipe(
      map(({ plan, bodegas, usuarios, productos }) => {
        const maxBodegas = limitesDesdeMi?.maxBodegas ?? plan?.maxBodegas ?? null;
        const maxUsuarios = limitesDesdeMi?.maxUsuarios ?? plan?.maxUsuarios ?? null;
        const maxProductos = limitesDesdeMi?.maxProductos ?? null;
        const errors: string[] = [];
        if (bodegas == null) errors.push('No se pudo consultar consumo de bodegas.');
        if (usuarios == null) errors.push('No se pudo consultar consumo de usuarios.');
        if (productos == null) errors.push('No se pudo consultar consumo de productos.');
        if (!plan && limitesDesdeMi == null) errors.push('No se pudo resolver el detalle del plan actual.');

        return {
          plan,
          resources: [
            this.toResource('bodegas', 'Bodegas', bodegas, maxBodegas),
            this.toResource('usuarios', 'Usuarios', usuarios, maxUsuarios),
            this.toResource('productos', 'Productos', productos, maxProductos)
          ],
          errors
        };
      })
    );
  }

  private toResource(
    key: 'bodegas' | 'usuarios' | 'productos',
    label: string,
    used: number | null,
    limit: number | null
  ): EmpresaCapacidadSnapshot['resources'][number] {
    if (used == null) {
      return { key, label, used: null, limit, usagePct: null, status: 'unknown', helper: 'Consumo no disponible por ahora.' };
    }
    if (limit == null) {
      return {
        key,
        label,
        used,
        limit: null,
        usagePct: null,
        status: 'ok',
        helper: `Has usado ${used}. Sin tope numérico en tu plan actual para este recurso.`
      };
    }
    const usagePct = Math.min(100, Math.round((used / limit) * 100));
    const remaining = Math.max(0, limit - used);
    if (used >= limit) {
      return { key, label, used, limit, usagePct, status: 'full', helper: `Has alcanzado el límite (${used} de ${limit}).` };
    }
    if (usagePct >= UI_NEAR_LIMIT_THRESHOLD) {
      return {
        key,
        label,
        used,
        limit,
        usagePct,
        status: 'near',
        helper: `Has usado ${used} de ${limit}. Te quedan ${remaining}.`
      };
    }
    return {
      key,
      label,
      used,
      limit,
      usagePct,
      status: 'ok',
      helper: `Has usado ${used} de ${limit}. Te quedan ${remaining}.`
    };
  }
}
