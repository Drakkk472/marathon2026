import { ComponentFixture, TestBed } from '@angular/core/testing';
<<<<<<< HEAD
=======
import { provideRouter } from '@angular/router';
>>>>>>> bc0f637 (first commit)
import { ReservationDashboardComponent } from './reservation-dashboard.component';
import { API_BASE_URL } from '@app/shared/config/api-base-url.token';

describe('ReservationDashboardComponent', () => {
  let component: ReservationDashboardComponent;
  let fixture: ComponentFixture<ReservationDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
<<<<<<< HEAD
      providers: [{ provide: API_BASE_URL, useValue: 'https://test.api' }],
=======
      providers: [{ provide: API_BASE_URL, useValue: 'https://test.api' }, provideRouter([])],
>>>>>>> bc0f637 (first commit)
      imports: [ReservationDashboardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ReservationDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
