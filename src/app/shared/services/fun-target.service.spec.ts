import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { FunTargetService } from './fun-target.service';

describe('FunTargetService', () => {
  let service: FunTargetService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(FunTargetService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads configuration from the backend and maps stored values', () => {
    let result: unknown;
    service.getConfiguration().subscribe((config) => result = config);

    const request = http.expectOne('/admin/games/fun-target/config');
    expect(request.request.method).toBe('GET');
    request.flush({
      id: 1,
      gameName: 'Fun Target',
      minBet: '1.00',
      maxBet: '5000.00',
      denominations: [1, 5, 10],
      resultMode: 'MANUAL',
      jokerEnabled: true,
      jokerMultiplier: 2,
      jokerFrequency: 5,
      adminSharePercent: '60.00',
      winningAllocationPercent: '40.00',
      active: true,
    });

    expect(result).toEqual(jasmine.objectContaining({
      minimumBetPerNumber: 1,
      maximumBetPerNumber: 5000,
      jokerEnabled: true,
      adminSharePercentage: 60,
      winningAllocationPercentage: 40,
      status: 'ACTIVE',
    }));
  });

  it('publishes a result with one atomic backend action', () => {
    let result: unknown;
    service.updateRound('15', 'publish', { winningNumber: 7 }).subscribe((round) => result = round);

    const request = http.expectOne('/admin/games/fun-target/rounds/15/publish');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ winningNumber: 7 });
    request.flush({
      id: 15,
      roundNumber: 4,
      status: 'COMPLETED',
      scheduledAt: '2026-10-26T12:00:00.000Z',
      openedAt: '2026-10-26T12:00:00.000Z',
      closedAt: '2026-10-26T12:10:00.000Z',
      resultMode: 'MANUAL',
      jokerEnabled: false,
      jokerMultiplier: 1,
      winningNumber: 7,
      createdAt: '2026-10-26T11:00:00.000Z',
    });

    expect(result).toEqual(jasmine.objectContaining({ id: '15', roundNumber: 4, status: 'COMPLETED', winningNumber: 7 }));
  });
});
