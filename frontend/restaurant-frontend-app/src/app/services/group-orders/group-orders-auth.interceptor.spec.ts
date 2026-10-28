import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ToastService } from '@app/services/toast/toast.service';
import { AuthenticationService } from '@app/auth/services/authentication.service';
import { tokenInterceptor } from '@app/auth/token.interceptor';

describe('Owner group review authentication', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authService: jasmine.SpyObj<AuthenticationService>;

  beforeEach(() => {
    authService = jasmine.createSpyObj<AuthenticationService>('AuthenticationService', [
      'getTokens',
    ]);
    authService.getTokens.and.returnValue({
      idToken: 'owner-id-token',
      accessToken: 'owner-access-token',
    });

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([tokenInterceptor])),
        provideHttpClientTesting(),
        { provide: ToastService, useValue: jasmine.createSpyObj('ToastService', ['error']) },
        { provide: AuthenticationService, useValue: authService },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

<<<<<<< HEAD
  it('attaches the owner id token to group sessions and status GETs', () => {
    http.get('https://api.test/guest/groups/group-1/sessions').subscribe();
    http.get('https://api.test/guest/groups/group-1/status').subscribe();

    const sessions = httpMock.expectOne('https://api.test/guest/groups/group-1/sessions');
    const status = httpMock.expectOne('https://api.test/guest/groups/group-1/status');
    expect(sessions.request.headers.get('Authorization')).toBe('Bearer owner-id-token');
    expect(status.request.headers.get('Authorization')).toBe('Bearer owner-id-token');
    sessions.flush({ participants: [], total: 0 });
    status.flush({ currentParticipants: 1, maxCapacity: 5, status: 'Open' });
=======
  it('attaches the owner id token to group sessions, status and guest-removal requests', () => {
    http.get('https://api.test/guest/groups/group-1/sessions').subscribe();
    http.get('https://api.test/guest/groups/group-1/status').subscribe();
    http.delete('https://api.test/guest/groups/group-1/sessions/session-1').subscribe();

    const sessions = httpMock.expectOne('https://api.test/guest/groups/group-1/sessions');
    const status = httpMock.expectOne('https://api.test/guest/groups/group-1/status');
    const removeGuest = httpMock.expectOne(
      'https://api.test/guest/groups/group-1/sessions/session-1'
    );
    expect(sessions.request.headers.get('Authorization')).toBe('Bearer owner-id-token');
    expect(status.request.headers.get('Authorization')).toBe('Bearer owner-id-token');
    expect(removeGuest.request.headers.get('Authorization')).toBe('Bearer owner-id-token');
    sessions.flush({ participants: [], total: 0 });
    status.flush({ currentParticipants: 1, maxCapacity: 5, status: 'Open' });
    removeGuest.flush({ participants: [], total: 0 });
>>>>>>> bc0f637 (first commit)
  });

  it('leaves guest session requests untouched', () => {
    http.post('https://api.test/guest/sessions', { name: 'Guest' }).subscribe();

    const request = httpMock.expectOne('https://api.test/guest/sessions');
    expect(request.request.headers.has('Authorization')).toBeFalse();
    request.flush({ guestSessionId: 'session-1' });
    expect(authService.getTokens).not.toHaveBeenCalled();
  });
});
