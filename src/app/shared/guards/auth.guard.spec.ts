import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../services/user.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  let role: UserRole | null;
  let authenticated: boolean;

  beforeEach(() => {
    role = 'superadmin';
    authenticated = true;
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            get isAuthenticated(): boolean { return authenticated; },
            get role(): UserRole | null { return role; },
          },
        },
      ],
    });
  });

  async function activateFunTarget() {
    return await TestBed.runInInjectionContext(() => authGuard(
      { data: { roles: ['superadmin'] } as ActivatedRouteSnapshot['data'] } as Partial<ActivatedRouteSnapshot> as ActivatedRouteSnapshot,
      { url: '/games/fun-target' } as RouterStateSnapshot,
    ));
  }

  it('allows superadmins to access Fun Target', async () => {
    expect(await activateFunTarget()).toBeTrue();
  });

  it('denies agents and administrators access to Fun Target', async () => {
    for (const deniedRole of ['agent', 'admin'] as const) {
      role = deniedRole;
      const result = await activateFunTarget();
      expect(result instanceof UrlTree).toBeTrue();
      expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/');
    }
  });

  it('redirects unauthenticated users to sign-in', async () => {
    authenticated = false;
    const result = await activateFunTarget();
    expect(result instanceof UrlTree).toBeTrue();
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/signin?returnUrl=%2Fgames%2Ffun-target');
  });
});
