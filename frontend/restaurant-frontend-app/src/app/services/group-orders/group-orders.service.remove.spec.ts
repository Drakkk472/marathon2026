import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '@app/shared/config/api-base-url.token';
import { GroupOrdersService } from './group-orders.service';

describe('GroupOrdersService removeSession$', () => {
  it('sends DELETE /guest/groups/{id}/sessions/{guestSessionId}', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'https://api.test' },
      ],
    });
    const http = TestBed.inject(HttpTestingController);
    TestBed.inject(GroupOrdersService).removeSession$('grp-1', 'gs-2').subscribe();

    const request = http.expectOne('https://api.test/guest/groups/grp-1/sessions/gs-2');
    expect(request.request.method).toBe('DELETE');
    request.flush({ message: 'Guest session removed from group successfully.' });
    http.verify();
  });
});
