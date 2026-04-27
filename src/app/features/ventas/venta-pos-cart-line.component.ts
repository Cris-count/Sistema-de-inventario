import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface CartLine {
  codigo: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
}

@Component({
  selector: 'li[app-venta-pos-cart-line]',
  imports: [DecimalPipe, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'cart-line',
    '[class.cart-line--warn]': 'stockInvalid()'
  },
  template: `
    <div class="line-head">
      <div>
        <span class="line-title">{{ line().nombre }}</span>
        <span class="line-code">{{ line().codigo }}</span>
      </div>
      <button type="button" class="btn btn-ghost btn-sm" [disabled]="paying()" (click)="remove.emit()">
        Quitar línea
      </button>
    </div>
    <div class="line-grid">
      <div class="line-label">
        <span>Cant.</span>
        <div class="qty-control" role="group" [attr.aria-label]="'Cantidad de ' + line().nombre">
          <button
            type="button"
            class="btn btn-ghost btn-sm qty-btn"
            [disabled]="paying() || line().cantidad <= 1"
            (click)="decrement.emit()"
            title="Disminuir cantidad"
          >
            -
          </button>
          <span class="qty-value" aria-live="polite">{{ line().cantidad | number }}</span>
          <button
            type="button"
            class="btn btn-ghost btn-sm qty-btn"
            [disabled]="paying() || stockLoading() || line().cantidad >= maxQuantity()"
            (click)="increment.emit()"
            [title]="maxTitle()"
          >
            +
          </button>
        </div>
      </div>
      <label class="line-label"
        >P. unit.
        <input
          type="number"
          class="input-inline"
          [ngModel]="line().precioUnitario"
          (ngModelChange)="priceChange.emit($event)"
          [disabled]="paying()"
          min="0"
          step="any"
        />
      </label>
      <span class="line-subtotal">
        <small>Subtotal</small>
        {{ subtotal() | number: '1.2-2' }}
      </span>
    </div>
    <p class="muted line-stock">
      Disponible en {{ warehouseLabel() }}: {{ stockAvailable() | number }}
      @if (line().cantidad >= maxQuantity()) {
        · máximo en carrito
      }
    </p>
  `,
  styles: `
    :host {
      display: block;
      padding: 0.58rem 0.62rem;
      border-radius: var(--radius-sm, 6px);
      border: 1px solid var(--border-subtle);
      background: color-mix(in srgb, var(--surface) 94%, var(--bg-panel));
    }

    :host(.cart-line--warn) {
      border-color: var(--color-warning, #ca8a04);
      background: color-mix(in srgb, var(--color-warning-soft, #fef3c7) 35%, var(--surface));
    }

    .btn-sm {
      padding: 0.25rem 0.5rem;
      font-size: 0.875rem;
    }

    .input-inline {
      width: 6.5rem;
      max-width: 100%;
    }

    .line-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.5rem;
    }

    .line-title {
      font-weight: 600;
      font-size: 0.86rem;
      display: block;
    }

    .line-code {
      color: var(--muted);
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.04em;
    }

    .line-grid {
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 0.35rem 0.5rem;
      align-items: end;
      font-size: 0.8rem;
    }

    .line-label {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
      margin: 0;
      font-size: 0.72rem;
      color: var(--muted);
    }

    .qty-control {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      width: max-content;
      padding: 0.15rem;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm, 6px);
      background: color-mix(in srgb, var(--surface) 88%, var(--bg-panel));
    }

    .qty-btn {
      min-width: 2rem;
      padding-inline: 0.45rem;
      font-weight: 700;
      line-height: 1.1;
    }

    .qty-value {
      min-width: 2.2rem;
      text-align: center;
      color: var(--text);
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }

    .line-subtotal {
      display: flex;
      flex-direction: column;
      gap: 0.05rem;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      text-align: right;
      padding-bottom: 0.2rem;
    }

    .line-subtotal small {
      font-weight: 400;
      color: var(--muted);
      font-size: 0.68rem;
    }

    .line-stock {
      margin: 0.25rem 0 0;
      font-size: 0.72rem;
    }
  `
})
export class VentaPosCartLineComponent {
  readonly line = input.required<CartLine>();
  readonly paying = input(false);
  readonly stockLoading = input(false);
  readonly stockInvalid = input(false);
  readonly maxQuantity = input(0);
  readonly maxTitle = input('');
  readonly stockAvailable = input(0);
  readonly warehouseLabel = input('');

  readonly remove = output<void>();
  readonly decrement = output<void>();
  readonly increment = output<void>();
  readonly priceChange = output<string | number>();

  subtotal(): number {
    return this.line().cantidad * this.line().precioUnitario;
  }
}
