import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { GroupOrdersService } from '@app/services/group-orders/group-orders.service';
import { ToastService } from '@app/services/toast/toast.service';
import { GroupSessionsResponse } from '@app/models/group-orders/group-sessions-response.model';
import { Order } from '@app/models/orders/order.model';
import { GuestInvite } from '@app/models/reservations/guest-invite.model';
import { GroupOrderPageComponent } from './group-order-page.component';
import { PreOrdersService } from '@app/services/pre-orders/pre-orders.service';

const caesar = { id: 'dish1', name: 'Caesar Salad', price: 180 };
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
      total: 180,
      items: [{ dish: caesar, quantity: 1 }],
    },
  ],
  total: 720,
};
const INVITE = {
  GroupReservationId: 'grp-1',
  LocationAddress: 'Rustaveli Avenue 48',
  MaxGuestCount: 5,
  StartTime: '2026-10-21T16:00:00Z',
  EndTime: '2026-10-21T17:30:00Z',
} as GuestInvite;

function buttonByText(root: ParentNode, text: string): HTMLButtonElement | undefined {
  return [...root.querySelectorAll('button')].find((button) => button.textContent?.trim() === text);
}

describe('Group-order page remove guest', () => {
  let service: jasmine.SpyObj<GroupOrdersService>;
  let preOrdersService: jasmine.SpyObj<PreOrdersService>;

  function create() {
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
          useValue: {
            snapshot: { paramMap: convertToParamMap({ reservationId: 'res-1' }) },
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(GroupOrderPageComponent);
    fixture.detectChanges();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  function removeButtons(element: HTMLElement): HTMLButtonElement[] {
    return [...element.querySelectorAll('button')].filter(
      (button) => button.textContent?.trim() === 'Remove Guest'
    );
  }

  beforeEach(() => {
    preOrdersService = jasmine.createSpyObj<PreOrdersService>('PreOrdersService', [
      'getByReservationId',
    ]);
    preOrdersService.getByReservationId.and.returnValue(of({ orderItems: [] } as unknown as Order));
    service = jasmine.createSpyObj<GroupOrdersService>('GroupOrdersService', [
      'getGroupInvite$',
      'getSessions$',
      'getOwnerSessionId$',
      'getStatus$',
      'submit$',
      'removeSession$',
    ]);
    service.getGroupInvite$.and.returnValue(of(INVITE));
    service.getSessions$.and.returnValue(of(structuredClone(SESSIONS)));
    service.getOwnerSessionId$.and.returnValue(of('owner'));
    service.getStatus$.and.returnValue(
      of({ currentParticipants: 3, maxCapacity: 5, status: 'Open' as const })
    );
  });

  it('offers Remove Guest for guests, not the owner', () => {
    expect(removeButtons(create().element).length).toBe(2);
  });

  it('provides an accessible name including the guest name', () => {
    expect(removeButtons(create().element)[0].getAttribute('aria-label')).toBe('Remove Andrii');
  });

  it('shows the group-order content on an opaque white panel', () => {
    const { fixture, element } = create();

    const content = element.querySelector<HTMLElement>('.content')!;

    expect(getComputedStyle(content).backgroundColor).toBe('rgb(255, 255, 255)');
  });

  it('styles the Remove Guest card button red with a gray outline and readable white text', () => {
    const { element } = create();
    const styles = getComputedStyle(removeButtons(element)[0]);

    expect(styles.backgroundColor).toBe('rgb(183, 11, 11)');
    expect(styles.color).toBe('rgb(255, 255, 255)');
    expect(styles.borderTopColor).toBe('rgb(87, 87, 87)');
  });

  it('closes the dialog and updates the guest list after the DELETE succeeds', () => {
    service.removeSession$.and.returnValue(of(undefined));
    const { fixture, element } = create();

    removeButtons(element)[1].click();
    fixture.detectChanges();
    const dialog = element.querySelector('[role="dialog"]')!;
    expect(dialog.textContent).toContain('Are you sure you want to remove');
    expect(dialog.textContent).toContain('Olena');

    buttonByText(dialog, 'Remove Guest')?.click();
    fixture.detectChanges();

    expect(service.removeSession$).toHaveBeenCalledOnceWith('grp-1', 'olena');
    expect(element.querySelectorAll('app-participant-card').length).toBe(2);
    expect(element.textContent).toContain('$540.00');
    expect(element.textContent).toContain('2 of 5 guests');
    expect(element.querySelector('[role="dialog"]')).toBeNull();
  });

  it('uses the participant list for the count instead of the API count', () => {
    service.getStatus$.and.returnValue(
      of({ currentParticipants: 4, maxCapacity: 5, status: 'Open' as const })
    );
    const { element } = create();

    expect(element.textContent).toContain('3 of 5 guests');
  });

  it('keeps the guest and dialog visible when the DELETE request fails', () => {
    service.removeSession$.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 400 }))
    );
    const { fixture, element } = create();

    removeButtons(element)[1].click();
    fixture.detectChanges();
    buttonByText(element.querySelector('[role="dialog"]')!, 'Remove Guest')?.click();
    fixture.detectChanges();

    expect(element.querySelectorAll('app-participant-card').length).toBe(3);
    expect(element.textContent).toContain("Couldn't remove guest. Please try again.");
    expect(element.querySelector('[role="dialog"]')).not.toBeNull();
  });

  it('does not offer guest removal after the group order is submitted', () => {
    service.getStatus$.and.returnValue(
      of({ currentParticipants: 3, maxCapacity: 5, status: 'Submitted' as const })
    );
    expect(removeButtons(create().element).length).toBe(0);
  });
});
