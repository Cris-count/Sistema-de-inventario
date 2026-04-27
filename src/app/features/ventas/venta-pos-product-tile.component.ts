import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

type AvailabilityState = 'available' | 'low' | 'loading' | 'no-warehouse' | 'out';

@Component({
  selector: 'app-venta-pos-product-tile',
  imports: [DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="product-card" [class.product-card--disabled]="disabled()" role="listitem">
      <div class="product-main">
        <span class="product-name">{{ nombre() }}</span>
        <span class="product-code">{{ codigo() }}</span>
      </div>
      <div class="product-meta">
        <span class="stock-pill">Stock {{ stock() | number }}</span>
        <span
          class="badge"
          [class.badge-ok]="availabilityState() === 'available'"
          [class.badge-warn]="
            availabilityState() === 'low' || availabilityState() === 'loading' || availabilityState() === 'no-warehouse'
          "
          [class.badge-off]="availabilityState() === 'out'"
        >
          {{ availabilityLabel() }}
        </span>
      </div>
      @if (quantityInCart() > 0) {
        <span class="product-cart-qty">En carrito: {{ quantityInCart() | number }}</span>
      }
      <span class="product-price">
        <small>Precio</small>
        {{ price() | number: '1.2-2' }}
      </span>
      @if (outOfStockVisible()) {
        <p class="product-unavailable">Sin stock en esta bodega</p>
      }
      <button
        type="button"
        class="btn btn-secondary btn-sm add-btn"
        [disabled]="actionDisabled()"
        [title]="actionTitle()"
        (click)="add.emit()"
      >
        {{ maxQuantity() >= 1 ? '+ Agregar' : 'Sin stock' }}
      </button>
    </div>
  `,
  styles: `
    .product-card {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 0.45rem 0.75rem;
      min-height: 9.25rem;
      padding: 0.78rem;
      border: 1px solid color-mix(in srgb, var(--border-subtle) 88%, var(--color-primary, var(--accent)));
      border-radius: calc(var(--radius-sm, 6px) + 2px);
      background: color-mix(in srgb, var(--surface) 96%, var(--bg-panel));
      transition: border-color 120ms ease, background 120ms ease;
    }

    .product-card--disabled {
      opacity: 0.72;
      background: color-mix(in srgb, var(--surface) 78%, var(--bg-panel));
    }

    .btn-sm {
      padding: 0.25rem 0.5rem;
      font-size: 0.875rem;
    }

    .product-main {
      grid-column: 1;
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
      min-width: 0;
    }

    .product-code {
      color: var(--muted);
      font-weight: 600;
      font-size: 0.72rem;
      letter-spacing: 0.04em;
    }

    .product-name {
      font-size: 0.98rem;
      font-weight: 700;
      line-height: 1.35;
    }

    .product-meta {
      grid-column: 1;
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem 0.5rem;
      font-size: 0.8rem;
      align-items: center;
    }

    .stock-pill {
      padding: 0.18rem 0.45rem;
      border-radius: 999px;
      background: color-mix(in srgb, var(--bg-panel) 80%, transparent);
      color: var(--muted);
      font-size: 0.74rem;
      font-weight: 600;
    }

    .product-cart-qty {
      grid-column: 1;
      color: var(--color-primary, var(--accent));
      font-size: 0.72rem;
      font-weight: 700;
    }

    .product-price {
      grid-column: 2;
      grid-row: 1;
      align-self: start;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.05rem;
      font-weight: 800;
      font-variant-numeric: tabular-nums;
      font-size: 1.18rem;
      color: var(--text);
    }

    .product-price small {
      color: var(--muted);
      font-size: 0.62rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .product-unavailable {
      grid-column: 1;
      margin: 0;
      font-size: 0.75rem;
      color: var(--muted);
    }

    .add-btn {
      grid-column: 1 / -1;
      align-self: end;
      justify-self: stretch;
      font-weight: 700;
      border-color: color-mix(in srgb, var(--color-primary, var(--accent)) 38%, var(--border));
    }
  `
})
export class VentaPosProductTileComponent {
  readonly nombre = input.required<string>();
  readonly codigo = input.required<string>();
  readonly stock = input.required<number>();
  readonly availabilityState = input.required<AvailabilityState>();
  readonly availabilityLabel = input.required<string>();
  readonly quantityInCart = input(0);
  readonly price = input.required<number>();
  readonly disabled = input(false);
  readonly actionDisabled = input(false);
  readonly actionTitle = input('');
  readonly outOfStockVisible = input(false);
  readonly maxQuantity = input(0);

  readonly add = output<void>();
}
