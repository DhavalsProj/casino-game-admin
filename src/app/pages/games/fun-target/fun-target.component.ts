import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, HostListener, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../shared/services/auth.service';
import { FunTargetService, FunTargetConfiguration, GameRound, RoundSummary, JokerSchedule, UserGameWallet } from '../../../shared/services/fun-target.service';

type Section = 'configuration' | 'rounds' | 'joker' | 'summary' | 'wallet';
@Component({ selector: 'app-fun-target', standalone: true, imports: [CommonModule, FormsModule], templateUrl: './fun-target.component.html' })
export class FunTargetComponent implements OnInit {
  section: Section = 'configuration';
  readonly betOptions = [1, 5, 10, 50, 100, 500, 1000, 5000];
  readonly numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  config: FunTargetConfiguration = { gameName: 'Fun Target', minimumBetPerNumber: 1, maximumBetPerNumber: 5000, availableBetOptions: [...this.betOptions], resultMinimum: 1, resultMaximum: 9, resultMode: 'MANUAL', jokerEnabled: false, jokerMultiplier: 2, jokerFrequency: 5, adminSharePercentage: 20, winningAllocationPercentage: 80, status: 'INACTIVE' };
  rounds: GameRound[] = [];
  schedules: JokerSchedule[] = [];
  selectedRound: GameRound | null = null;
  summary: RoundSummary | null = null;
  wallet: UserGameWallet | null = null;
  walletUserId = '';
  roundStart = '';
  winningNumber: number | null = null;
  scheduleRoundNumber = '';
  loading = false;
  saving = false;
  error = '';
  success = '';
  confirmation: { title: string; description: string; confirmLabel: string; destructive: boolean; onConfirm: () => void } | null = null;

  constructor(public auth: AuthService, private api: FunTargetService, private cdr: ChangeDetectorRef) {}
  get canManage(): boolean { return this.auth.role === 'superadmin'; }
  get sharesTotal(): number { return Number(this.config.adminSharePercentage) + Number(this.config.winningAllocationPercentage); }

  ngOnInit(): void { this.loadConfiguration(); this.loadRounds(); this.loadSchedules(); }
  chooseSection(section: Section): void { this.section = section; this.error = ''; this.success = ''; }
  toggleBetOption(option: number, checked: boolean): void { this.config.availableBetOptions = checked ? [...new Set([...this.config.availableBetOptions, option])].sort((a,b) => a-b) : this.config.availableBetOptions.filter((value) => value !== option); }

  saveConfiguration(): void {
    if (!this.canManage) return;
    if (!this.config.gameName.trim() || this.config.minimumBetPerNumber <= 0 || this.config.maximumBetPerNumber < this.config.minimumBetPerNumber || !this.config.availableBetOptions.length || this.sharesTotal !== 100 || this.config.jokerMultiplier < 1 || this.config.jokerFrequency < 1) { this.error = 'Review the configuration. Bets must be valid, at least one option is required, and allocation shares must total 100%.'; return; }
    this.saving = true;
    this.run(() => this.api.saveConfiguration({ ...this.config, gameName: this.config.gameName.trim() }), (config) => { this.config = config; this.success = 'Configuration saved.'; });
  }
  createRound(): void {
    if (!this.canManage || !this.roundStart || Date.parse(this.roundStart) <= Date.now()) { this.error = 'Choose a future round schedule time.'; return; }
    this.confirmAction('Create round?', 'Are you sure you want to create this scheduled round?', 'Create round', () => {
      this.run(() => this.api.createRound(new Date(this.roundStart).toISOString()), () => { this.success = 'Round created.'; this.loadRounds(); });
    });
  }
  roundAction(round: GameRound, action: 'open' | 'close' | 'publish'): void {
    if (!this.canManage) return;
    const body = action === 'publish' && round.resultMode === 'MANUAL' ? { winningNumber: Number(this.winningNumber) } : undefined;
    if (action === 'publish' && round.resultMode === 'MANUAL' && (!this.winningNumber || this.winningNumber < 1 || this.winningNumber > 9)) { this.error = 'Choose a winning number from 1 to 9.'; return; }
    const updateRound = () => this.run(() => this.api.updateRound(round.id, action, body), () => { this.success = action === 'publish' ? 'Round finalized.' : `Betting ${action === 'open' ? 'opened' : 'closed'}.`; this.loadRounds(); if (this.selectedRound?.id === round.id) this.viewRound(round); });
    if (action === 'publish') {
      this.confirmAction('Finalize result?', 'Are you sure you want to finalize and publish this result? A finalized result cannot be edited here.', 'Finalize result', updateRound);
      return;
    }
    updateRound();
  }
  viewRound(round: GameRound): void { this.selectedRound = round; this.section = 'summary'; this.summary = null; this.run(() => this.api.getRoundSummary(round.id), (summary) => this.summary = summary); }
  loadWallet(): void {
    const id = Number(this.walletUserId);
    if (!Number.isSafeInteger(id) || id <= 0) { this.error = 'Enter a valid user ID.'; return; }
    this.run(() => this.api.getUserWallet(id), (wallet) => this.wallet = wallet);
  }
  scheduleJoker(): void {
    const number = Number(this.scheduleRoundNumber);
    const round = this.rounds.find((item) => item.roundNumber === number && item.status === 'UPCOMING');
    if (!this.canManage || !round || this.schedules.some((item) => item.roundNumber === number && item.status === 'SCHEDULED')) { this.error = 'Choose an upcoming round without an existing Joker schedule.'; return; }
    this.confirmAction('Schedule Joker?', `Are you sure you want to schedule Joker activation for round ${number}?`, 'Schedule Joker', () => {
      this.run(() => this.api.scheduleJoker(Number(round.id), this.config.jokerMultiplier), () => { this.success = 'Joker activation scheduled.'; this.scheduleRoundNumber = ''; this.loadSchedules(); });
    });
  }
  cancelSchedule(schedule: JokerSchedule): void {
    if (!this.canManage || schedule.status !== 'SCHEDULED') return;
    this.confirmAction('Cancel Joker schedule?', `Are you sure you want to cancel Joker activation for round ${schedule.roundNumber}?`, 'Cancel schedule', () => {
      this.run(() => this.api.cancelJokerSchedule(schedule.id), () => { this.success = 'Joker schedule cancelled.'; this.loadSchedules(); });
    }, true);
  }
  closeConfirmation(): void { this.confirmation = null; }
  @HostListener('document:keydown.escape')
  onEscape(): void { this.closeConfirmation(); }
  confirmPendingAction(): void {
    const confirmation = this.confirmation;
    if (this.loading) return;
    this.closeConfirmation();
    confirmation?.onConfirm();
  }
  refresh(): void { this.loadConfiguration(); this.loadRounds(); this.loadSchedules(); }
  canOpenRound(round: GameRound): boolean { return Date.parse(round.scheduledAt) <= Date.now(); }
  jokerRoundStatus(schedule: JokerSchedule): string {
    const status = this.rounds.find((round) => round.id === schedule.roundId)?.status;
    if (status === 'OPEN') return 'ACTIVE';
    if (status === 'COMPLETED') return 'COMPLETED';
    return schedule.status;
  }
  jokerScheduledAt(schedule: JokerSchedule): string | null {
    return this.rounds.find((round) => round.id === schedule.roundId)?.scheduledAt ?? null;
  }
  private confirmAction(title: string, description: string, confirmLabel: string, onConfirm: () => void, destructive = false): void {
    this.confirmation = { title, description, confirmLabel, destructive, onConfirm };
  }
  private loadConfiguration(): void { this.run(() => this.api.getConfiguration(), (config) => this.config = config); }
  private loadRounds(): void { this.run(() => this.api.getRounds(), (rounds) => this.rounds = rounds); }
  private loadSchedules(): void { this.run(() => this.api.getJokerSchedules(), (schedules) => this.schedules = schedules); }
  private run<T>(request: () => import('rxjs').Observable<T>, success: (value: T) => void): void {
    this.loading = true; this.error = ''; this.success = '';
    request().subscribe({ next: (value) => { success(value); this.loading = false; this.saving = false; this.cdr.detectChanges(); }, error: (error: unknown) => { this.error = this.errorText(error); this.loading = false; this.saving = false; this.cdr.detectChanges(); } });
  }
  private errorText(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) return 'Could not reach the game API. Confirm the backend is running.';
      if (error.error instanceof SyntaxError || (typeof error.error?.message === 'string' && /valid JSON|Unexpected token/i.test(error.error.message))) return 'The game API returned HTML instead of JSON. Confirm the frontend proxy and backend API route are configured.';
      if (error.status === 404) return 'This game API endpoint is not available on the backend yet.';
      if (error.status === 401 || error.status === 403) return error.status === 401 ? 'Your session expired. Sign in again.' : 'Your account is not authorized for this action.';
      if (typeof error.error?.message === 'string') return error.error.message;
    }
    return 'The request failed. Please try again.';
  }
}
