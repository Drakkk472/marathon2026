// Рівень 2 · сторінка на даних з API. Сервіс підмінено шпигуном — у мережу тест не ходить.
// Запуск: npm run test:hw
import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { GroupOrdersService } from '@app/services/group-orders/group-orders.service';
import { ToastService } from '@app/services/toast/toast.service';
import { GroupSessionsResponse } from '@app/models/group-orders/group-sessions-response.model';
import { Order } from '@app/models/orders/order.model';
import { GuestInvite } from '@app/models/reservations/guest-invite.model';
import { GroupOrderPageComponent } from './group-order-page.component';
import { PreOrdersService } from '@app/services/pre-orders/pre-orders.service';

const caesar = { id: 'dish1', name: 'Caesar Salad', price: 180 };
const tomYum = { id: 'dish2', name: 'Tom Yum', price: 220 };
const ownerOrderDish = {
  id: 'owner-dish',
  name: 'Grilled Salmon',
  imageUrl: '',
  price: 21,
  state: 'Available',
  weight: '250 g',
  dishType: 'Main',
  description: '',
  calories: '0',
  proteins: '0',
  carbohydrates: '0',
  fats: '0',
  vitamins: '0',
};
const OWNER_ORDER: Order = {
  orderId: 'order-1',
  reservationAddress: 'Rustaveli Avenue 48',
  reservationTime: '2026-10-21T16:00:00Z',
  reservationId: 'res-1',
  status: 0,
  orderItems: [
    {
      dish: { ...ownerOrderDish, id: caesar.id, name: caesar.name, price: caesar.price },
      quantity: 1,
      state: 0,
    },
  ],
};

const SESSIONS: GroupSessionsResponse = {
  participants: [
    {
      id: 'owner',
      type: 'Owner',
      name: 'Yevhenii',
      isSubmitted: true,
      total: 180,
      items: [{ dish: caesar, quantity: 1 }],
    },
    {
      id: 'andrii',
      type: 'Guest',
      name: 'Andrii',
      isSubmitted: true,
      total: 360,
      items: [{ dish: caesar, quantity: 2 }],
    },
    {
      id: 'olena',
      type: 'Guest',
      name: 'Olena',
      isSubmitted: false,
      total: 220,
      items: [{ dish: tomYum, quantity: 1 }],
    },
  ],
  total: 760,
};
const INVITE = {
  GroupReservationId: 'grp-1',
  LocationAddress: 'Rustaveli Avenue 48',
  MaxGuestCount: 5,
  StartTime: '2026-10-21T16:00:00Z',
  EndTime: '2026-10-21T17:30:00Z',
} as GuestInvite;

function buttonByText(root: ParentNode, text: string): HTMLButtonElement | undefined {
  return [...root.querySelectorAll('button')].find((b) => b.textContent?.trim() === text) as
    | HTMLButtonElement
    | undefined;
}

describe('Рівень 2 · сторінка Owner Review', () => {
  let service: jasmine.SpyObj<GroupOrdersService>;
  let preOrdersService: jasmine.SpyObj<PreOrdersService>;

  function create(reservationId = 'res-1') {
    TestBed.configureTestingModule({
      imports: [GroupOrderPageComponent],
      providers: [
        { provide: GroupOrdersService, useValue: service },
        { provide: PreOrdersService, useValue: preOrdersService },
        {
          provide: ToastService,
          useValue: jasmine.createSpyObj('ToastService', ['success', 'error', 'info']),
        },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ reservationId }) } },
        },
      ],
    });
    const fixture = TestBed.createComponent(GroupOrderPageComponent);
    fixture.detectChanges();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  beforeEach(() => {
    preOrdersService = jasmine.createSpyObj<PreOrdersService>('PreOrdersService', [
      'getByReservationId',
    ]);
    preOrdersService.getByReservationId.and.returnValue(of(structuredClone(OWNER_ORDER)));
    service = jasmine.createSpyObj<GroupOrdersService>('GroupOrdersService', [
      'getGroupInvite$',
      'getSessions$',
      'getOwnerSessionId$',
      'getStatus$',
      'submit$',
    ]);
    service.getGroupInvite$.and.returnValue(of(INVITE));
    service.getSessions$.and.returnValue(of(structuredClone(SESSIONS)));
    service.getOwnerSessionId$.and.returnValue(of('owner'));
    service.getStatus$.and.returnValue(
      of({ currentParticipants: 3, maxCapacity: 5, status: 'Open' as const })
    );
  });

  describe('дані', () => {
    it('uses the URL reservation ID to load the real API-backed group review', () => {
      create('reservation-real-42');
      expect(service.getGroupInvite$).toHaveBeenCalledOnceWith('reservation-real-42');
      expect(service.getSessions$).toHaveBeenCalledOnceWith('grp-1');
      expect(service.getOwnerSessionId$).toHaveBeenCalledOnceWith('reservation-real-42');
      expect(service.getStatus$).toHaveBeenCalledOnceWith('grp-1');
      expect(preOrdersService.getByReservationId).toHaveBeenCalledOnceWith('reservation-real-42', {
        silent: true,
      });
    });

    it('loads the owner’s selected dishes from the reservation pre-order API', () => {
      preOrdersService.getByReservationId.and.returnValue(
        of({
          ...OWNER_ORDER,
          orderItems: [{ dish: ownerOrderDish, quantity: 2, state: 0 }],
        })
      );
      const { element } = create();
      const ownerCard = element.querySelector('app-participant-card');

      expect(ownerCard?.textContent).toContain('Grilled Salmon');
      expect(ownerCard?.textContent).toContain('$42.00');
      expect(element.textContent).toContain('$402.00');
    });

    it('keeps the group-session owner dishes when no reservation order exists', () => {
      preOrdersService.getByReservationId.and.returnValue(
        throwError(() => new HttpErrorResponse({ status: 404 }))
      );
      const { element } = create();

      expect(element.querySelector('app-participant-card')?.textContent).toContain('Caesar Salad');
      expect(element.textContent).toContain('$540.00');
    });

    it('показує всіх учасників; власна картка — «My Pre-Order»', () => {
      const { element } = create();
      expect(element.querySelectorAll('app-participant-card').length).toBe(3);
      expect(element.textContent).toContain('My Pre-Order');
      expect(element.textContent).toContain('Guest: Andrii');
    });

    it('бейдж статусу: «Collecting pre-orders»', () => {
      expect(create().element.textContent).toContain('Collecting pre-orders');
    });
  });

  describe('консолідоване замовлення — головна пастка', () => {
    it('Grand Total рахує лише підтверджені кошики: $540, а не $760 з API', () => {
      const text = create().element.textContent ?? '';
      expect(text).toContain('$540.00');
      expect(text).not.toContain('$760.00');
    });

    it('однакові страви — одним рядком: «Caesar Salad × 3»', () => {
      expect(create().element.textContent).toContain('Caesar Salad × 3');
    });

    it('жовта плашка: «1 participant hasn’t submitted…»', () => {
      expect(create().element.textContent).toMatch(/1 participant hasn.t submitted/);
    });
  });

  describe('стани екрана', () => {
    it('порожньо: «Participants haven’t added any dishes yet»', () => {
      const empty = structuredClone(SESSIONS);
      empty.participants.forEach((p) => (p.items = []));
      service.getSessions$.and.returnValue(of(empty));
      preOrdersService.getByReservationId.and.returnValue(of({ ...OWNER_ORDER, orderItems: [] }));
      expect(create().element.textContent).toMatch(/Participants haven.t added any dishes yet/);
    });

    it('404: «Group reservation not found»', () => {
      service.getGroupInvite$.and.returnValue(
        throwError(() => new HttpErrorResponse({ status: 404 }))
      );
      expect(create().element.textContent).toContain('Group reservation not found');
    });

    it('keeps a server-provided API error visible and still offers retry', () => {
      service.getGroupInvite$.and.returnValue(
        throwError(
          () =>
            new HttpErrorResponse({
              status: 400,
              error: { message: 'Guest limit exceeded' },
            })
        )
      );
      const { element } = create();

      expect(element.textContent).toContain('Guest limit exceeded');
      expect(buttonByText(element, 'Try again')).toBeDefined();
    });

    it('403: explains owner-only access and does not offer a futile retry', () => {
      service.getGroupInvite$.and.returnValue(
        throwError(() => new HttpErrorResponse({ status: 403 }))
      );
      const { element } = create();
      expect(element.textContent).toContain(
        "You don't have permission to view this group pre-order."
      );
      expect(buttonByText(element, 'Try again')).toBeUndefined();
    });

    it('інша помилка: кнопка «Try again» вантажить ще раз', () => {
      service.getGroupInvite$.and.returnValue(
        throwError(() => new HttpErrorResponse({ status: 500 }))
      );
      const { fixture, element } = create();
      buttonByText(element, 'Try again')?.click();
      fixture.detectChanges();
      expect(service.getGroupInvite$).toHaveBeenCalledTimes(2);
    });
  });

  describe('Submit Pre-Order', () => {
    it('кнопка неактивна, якщо ніхто не підтвердив кошик', () => {
      const nobody = structuredClone(SESSIONS);
      nobody.participants.forEach((p) => (p.isSubmitted = false));
      service.getSessions$.and.returnValue(of(nobody));
      preOrdersService.getByReservationId.and.returnValue(of({ ...OWNER_ORDER, orderItems: [] }));
      expect(buttonByText(create().element, 'Submit Pre-Order')?.disabled).toBeTrue();
    });

    it('«Submit Pre-Order» → діалог → «Submit»: запит іде один раз навіть при подвійному кліку', () => {
      const response$ = new Subject<{ dishId: string; quantity: number }[]>();
      service.submit$.and.returnValue(response$);
      const { fixture, element } = create();

      buttonByText(element, 'Submit Pre-Order')?.click();
      fixture.detectChanges();
      const dialog = element.querySelector('[role="dialog"]');
      expect(dialog).withContext('має відкритись <app-modal>').not.toBeNull();

      buttonByText(dialog!, 'Submit')?.click();
      fixture.detectChanges();
      buttonByText(dialog!, 'Submit')?.click();
      buttonByText(dialog!, 'Submitting…')?.click();
      fixture.detectChanges();

      expect(service.submit$).toHaveBeenCalledOnceWith('grp-1', 'res-1');
    });

    it('після успіху: «Sent to Restaurant», кнопки Submit більше немає', () => {
      service.submit$.and.returnValue(of([{ dishId: 'dish1', quantity: 3 }]));
      const { fixture, element } = create();
      buttonByText(element, 'Submit Pre-Order')?.click();
      fixture.detectChanges();
      buttonByText(element.querySelector('[role="dialog"]')!, 'Submit')?.click();
      fixture.detectChanges();

      expect(element.textContent).toContain('Sent to Restaurant');
      expect(buttonByText(element, 'Submit Pre-Order')).toBeUndefined();
    });

    it('помилка submit: екран не ламається, кнопку можна натиснути знову', () => {
      service.submit$.and.returnValue(throwError(() => new HttpErrorResponse({ status: 400 })));
      const { fixture, element } = create();
      buttonByText(element, 'Submit Pre-Order')?.click();
      fixture.detectChanges();
      buttonByText(element.querySelector('[role="dialog"]')!, 'Submit')?.click();
      fixture.detectChanges();

      expect(buttonByText(element, 'Submit Pre-Order')?.disabled).toBeFalse();
    });
  });
});
