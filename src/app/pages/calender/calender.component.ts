import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventInput } from 'fullcalendar';
import dayGridPlugin from 'fullcalendar/daygrid';
import interactionPlugin from 'fullcalendar/interaction';
import multiMonthPlugin from 'fullcalendar/multimonth';
import themePlugin from 'fullcalendar/themes/classic';
import timeGridPlugin from 'fullcalendar/timegrid';
import { ApplicationDataService, ApplicationDataSnapshot } from '../../shared/services/application-data.service';

export interface CalendarEvent extends EventInput {
  extendedProps: {
    calendar: string;
    source: 'user' | 'agent' | 'wallet-request' | 'transaction';
    dateKey: string;
    occurredAt: string;
    hasTime: boolean;
    details: { label: string; value: string }[];
  };
}

@Component({
  selector: 'app-calender',
  standalone: true,
  imports: [
    CommonModule,
    FullCalendarModule,
  ],
  templateUrl: './calender.component.html',
  styles: ``
})
export class CalenderComponent implements OnInit {
  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;

  events: CalendarEvent[] = [];
  selectedEvent: CalendarEvent | null = null;
  isEventDetailsOpen = false;
  isMobile = false;
  isLoading = true;
  errorMessage = '';

  currentView = 'dayGridMonth';

  viewOptions = [
    { key: 'dayGridMonth', label: 'Month' },
    { key: 'multiMonthYear', label: 'Year' },
    { key: 'timeGridWeek', label: 'Week' },
    { key: 'timeGridDay', label: 'Day' },
  ];

  calendarOptions!: CalendarOptions;

  constructor(
    private readonly elRef: ElementRef,
    private readonly applicationData: ApplicationDataService,
    private readonly changeDetector: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.checkMobile();

    this.initCalendarOptions();
    this.loadApplicationEvents();
  }

  @HostListener('window:resize')
  onResize() {
    this.checkMobile();
  }

  checkMobile() {
    const mobile = typeof window !== 'undefined' && window.innerWidth < 640;
    if (this.isMobile !== mobile) {
      this.isMobile = mobile;
      if (this.calendarOptions) {
        this.initCalendarOptions();
      }
    }
  }

  initCalendarOptions() {
    const isRtl = typeof document !== 'undefined' && document.documentElement.dir === 'rtl';
    const locale = (typeof document !== 'undefined' && document.documentElement.lang) || 'en';

    this.calendarOptions = {
      plugins: [
        themePlugin,
        dayGridPlugin,
        timeGridPlugin,
        interactionPlugin,
        multiMonthPlugin,
      ],
      initialView: this.currentView || 'dayGridMonth',
      direction: isRtl ? 'rtl' : 'ltr',

      // Toolbar Header configuration
      headerToolbar: {
        start: 'prev,next',
        center: 'title',
        end: ''
      },
      headerToolbarClass:
        'sticky top-0! z-20! bg-white dark:bg-gray-900 flex-wrap! flex-row! items-center justify-between gap-3 sm:gap-4 [padding-inline:16px]! sm:[padding-inline:24px]! pt-4 sm:pt-6 pb-3 sm:pb-4',
      toolbarTitleClass: 'text-base! sm:text-lg! font-semibold! text-gray-800 dark:text-white/90',
      toolbarSectionClass: (info: any) => {
        if (info.name === 'start') {
          return 'ta-toolbar-section ta-toolbar-start order-2 flex w-full items-center justify-between sm:order-1 sm:w-auto sm:justify-start gap-2';
        }
        if (info.name === 'center') {
          return 'ta-toolbar-section ta-toolbar-center order-1 flex items-center justify-start sm:order-2 sm:justify-center';
        }
        if (info.name === 'end') {
          return 'ta-toolbar-section ta-toolbar-end order-1 flex items-center justify-end sm:order-3 sm:justify-end';
        }
        return 'ta-toolbar-section';
      },
      buttonGroupClass: 'gap-2',

      buttons: {
        prev: {
          iconContent: {
            html: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="size-5 sm:size-6 bg-transparent text-gray-700 rtl:rotate-180 dark:text-gray-400"><path d="M15 18l-6-6 6-6" /></svg>`,
          },
          className:
            'flex size-9! sm:size-10! p-0! items-center justify-center! rounded-lg! border! bg-transparent! border-gray-200! text-gray-700 hover:border-gray-200 hover:bg-gray-50! focus:shadow-none active:border-gray-200! active:bg-transparent! active:shadow-none! dark:border-gray-800! dark:text-gray-400 dark:hover:border-gray-800 dark:hover:bg-gray-900! dark:active:border-gray-800!',
        },
        next: {
          iconContent: {
            html: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="size-5 sm:size-6 bg-transparent text-gray-700 rtl:rotate-180 dark:text-gray-400"><path d="M9 18l6-6-6-6" /></svg>`,
          },
          className:
            'flex size-9! sm:size-10! p-0! items-center justify-center! rounded-lg! border! bg-transparent! border-gray-200! text-gray-700 hover:border-gray-200 hover:bg-gray-50! focus:shadow-none active:border-gray-200! active:bg-transparent! active:shadow-none! dark:border-gray-800! dark:text-gray-400 dark:hover:border-gray-800 dark:hover:bg-gray-900! dark:active:border-gray-800!',
        },
      },

      // View configurations
      views: {
        multiMonthYear: {
          multiMonthMaxColumns: 3,
          singleMonthClass: 'fc-multimonth',
          tableClass:
            'overflow-visible! border-0! sm:border! sm:border-gray-200! dark:sm:border-gray-800! rounded-none! sm:rounded-lg! mt-0!',
          singleMonthHeaderClass:
            'mb-0! bg-white dark:bg-gray-900 sm:bg-transparent! dark:sm:bg-transparent!',
          tableHeaderClass:
            'mb-0! rounded-none! sm:rounded-t-lg! bg-gray-50 dark:bg-gray-900 dark:sm:bg-transparent!',
          tableBodyClass: 'mt-0!',
          singleMonthMinWidth: 280,
          showNonCurrentDates: true,
          singleMonthHeaderInnerClass:
            'text-sm font-medium! text-gray-800 dark:text-white/90',
          dayHeaderRowClass: 'fc-multimonth-day-header-row',
          dayHeaderClass: (data: any) =>
            data.inPopover
              ? 'relative! border-b! border-gray-200! bg-gray-50/70! px-4! py-3! text-start! dark:border-gray-800! dark:bg-gray-800/50!'
              : 'border-0! bg-gray-50 py-2! dark:bg-gray-900 dark:sm:bg-transparent! first:rounded-none! first:sm:rounded-ss-lg! last:rounded-none! last:sm:rounded-se-lg!',
          dayHeaderInnerClass: (data: any) =>
            data.inPopover
              ? 'text-sm! font-semibold! text-gray-800! dark:text-white/90!'
              : 'py-1 text-[11px] sm:text-xs font-medium text-gray-400 uppercase',
          dayCellClass: (data: any) => {
            if (data.inPopover) return 'bg-transparent! p-3!';
            let cls = 'relative! p-0.5 sm:p-1!';
            if (data.isOther) cls += ' bg-transparent!';
            return cls;
          },
          dayCellInnerClass: (data: any) =>
            data.inPopover
              ? 'flex custom-scrollbar max-h-60 flex-col gap-1.5 overflow-y-auto'
              : 'h-0 max-h-0 overflow-hidden invisible',
          dayCellTopInnerClass: 'text-xs! sm:text-sm!',
          dayMaxEvents: false,
          moreLinkClass:
            'border-0! bg-transparent! p-0! hover:bg-transparent! focus:outline-none',
          rowMoreLinkClass:
            'absolute! -top-0.5! sm:-top-1! start-0.5! z-10! border-0! bg-transparent! p-0!',
          rowMoreLinkInnerClass: 'overflow-visible!',
          moreLinkContent() {
            return {
              html: `<span><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4.5 sm:size-5.5 text-brand-500"><path d="M19 3v17a1 1 0 01-1.496.868l-4.512-2.578a2 2 0 00-1.984 0l-4.512 2.578A1 1 0 015 20V3z" /></svg></span>`,
            };
          },
        },
        dayGridMonth: {
          dayMaxEvents: false,
          dayHeaderAlign: (data: any) => (data.inPopover ? 'start' : 'center'),
          dayHeaderClass: (data: any) =>
            data.inPopover
              ? 'relative! border-b! border-gray-200! bg-gray-50/70! px-4! py-3! text-start! dark:border-gray-800! dark:bg-gray-800/50!'
              : 'border-x-0! border-t border-gray-200! bg-gray-50 dark:border-gray-800! dark:bg-gray-900',
          dayHeaderInnerClass: (data: any) =>
            data.inPopover
              ? 'text-sm! font-semibold! text-gray-800! dark:text-white/90!'
              : 'px-1! py-2! sm:px-3! sm:py-3! md:px-5! md:py-4! text-xs! sm:text-sm! font-medium! text-gray-400 uppercase',
          dayCellClass: (data: any) => {
            if (data.inPopover) return 'bg-transparent! p-3!';
            return 'bg-transparent! p-1! sm:p-2!';
          },
          dayCellInnerClass: (data: any) => {
            if (data.inPopover)
              return 'flex custom-scrollbar max-h-60 flex-col gap-1.5 overflow-y-auto';
            if (this.isMobile)
              return 'h-0 max-h-0 overflow-hidden invisible';
            return '';
          },
          rowMoreLinkClass: this.isMobile
            ? 'absolute! -top-1! -start-0.5! z-10! border-0! bg-transparent! p-0!'
            : '',
          rowMoreLinkInnerClass: this.isMobile ? 'overflow-visible!' : '',
          moreLinkClass:
            'border-0! bg-transparent! p-0! hover:bg-transparent! focus:outline-none',
          moreLinkContent: (args: any) => {
            if (this.isMobile) {
              return {
                html: `<span><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4.5 sm:size-5.5 text-brand-500"><path d="M19 3v17a1 1 0 01-1.496.868l-4.512-2.578a2 2 0 00-1.984 0l-4.512 2.578A1 1 0 015 20V3z" /></svg></span>`,
              };
            }
            return {
              html: `<span class="fc-more-link-badge inline-flex items-center rounded-sm bg-brand-50 px-1 py-0.5 sm:px-1.5 text-[10px] sm:text-xs font-medium text-brand-600 transition-colors hover:bg-brand-100 dark:bg-brand-500/15 dark:text-brand-400 dark:hover:bg-brand-500/25">+${args.num} more</span>`,
            };
          },
        },
        timeGridWeek: {
          slotDuration: '01:00:00',
          slotMinHeight: 56,
          allDaySlot: true,
          dayMaxEvents: false,
          moreLinkClass:
            'border-0! bg-transparent! p-0! hover:bg-transparent! focus:outline-none',
          rowMoreLinkClass: this.isMobile
            ? 'absolute! -top-1! -start-0.5! z-10! border-0! bg-transparent! p-0!'
            : '',
          rowMoreLinkInnerClass: this.isMobile ? 'overflow-visible!' : '',
          moreLinkContent: this.isMobile
            ? () => ({
                html: `<span><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4.5 sm:size-5.5 text-brand-500"><path d="M19 3v17a1 1 0 01-1.496.868l-4.512-2.578a2 2 0 00-1.984 0l-4.512 2.578A1 1 0 015 20V3z" /></svg></span>`,
              })
            : undefined,
          dayHeaderContent: (arg: any) => {
            const weekday = new Intl.DateTimeFormat(locale, {
              weekday: 'short',
            })
              .format(arg.date)
              .toUpperCase();
            const day = new Intl.DateTimeFormat(locale, {
              day: 'numeric',
            }).format(arg.date);
            return `${weekday} - ${day}`;
          },
          dayHeaderClass: (data: any) =>
            'border-0! bg-gray-50! dark:bg-gray-900!',
          dayHeaderInnerClass: (data: any) =>
            'px-1.5! sm:px-3! py-2.5! sm:py-3.5! text-center! text-[11px]! sm:text-xs! font-medium! text-gray-500! uppercase! dark:text-gray-400!',
          slotHeaderDividerClass:
            'border-e! border-s-0! border-y-0! border-gray-200! dark:border-gray-800!',
          slotHeaderClass:
            'px-1.5! sm:px-3! py-1.5! sm:py-2! text-start! text-[11px]! sm:text-xs! font-medium! text-gray-400! dark:text-gray-500!',
          slotLaneClass: 'border-gray-100! dark:border-gray-800/60!',
          dayLaneClass: (data: any) =>
            'border-gray-200! dark:border-gray-800!',
          allDayDividerClass:
            'border-b! border-t-0! border-x-0! border-gray-200! p-0! bg-transparent! dark:border-gray-800!',
          allDayHeaderClass:
            'border-0! bg-gray-50! text-[11px]! sm:text-xs! font-medium! text-gray-500! dark:border-0! dark:bg-gray-900! dark:text-gray-400!',
        },
        timeGridDay: {
          slotDuration: '00:30:00',
          slotMinHeight: 48,
          allDaySlot: true,
          dayMaxEvents: false,
          moreLinkClass:
            'border-0! bg-transparent! p-0! hover:bg-transparent! focus:outline-none',
          rowMoreLinkClass: this.isMobile
            ? 'absolute! -top-1! -start-0.5! z-10! border-0! bg-transparent! p-0!'
            : '',
          rowMoreLinkInnerClass: this.isMobile ? 'overflow-visible!' : '',
          moreLinkContent: this.isMobile
            ? () => ({
                html: `<span><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4.5 sm:size-5.5 text-brand-500"><path d="M19 3v17a1 1 0 01-1.496.868l-4.512-2.578a2 2 0 00-1.984 0l-4.512 2.578A1 1 0 015 20V3z" /></svg></span>`,
              })
            : undefined,
          dayHeaderContent: (arg: any) => {
            const weekday = new Intl.DateTimeFormat(locale, {
              weekday: 'short',
            })
              .format(arg.date)
              .toUpperCase();
            const day = new Intl.DateTimeFormat(locale, {
              day: 'numeric',
            }).format(arg.date);
            return `${weekday} - ${day}`;
          },
          dayHeaderClass: (data: any) =>
            'border-0! bg-gray-50! dark:bg-gray-900!',
          dayHeaderInnerClass: (data: any) =>
            'px-2! sm:px-4! py-2.5! sm:py-3.5! text-center! text-xs! font-medium! text-gray-500! uppercase! dark:text-gray-400!',
          slotHeaderDividerClass:
            'border-e! border-s-0! border-y-0! border-gray-200! dark:border-gray-800!',
          slotHeaderClass:
            'px-2! sm:px-3! py-1.5! sm:py-2! text-start! text-[11px]! sm:text-xs! font-medium! text-gray-400! dark:text-gray-500!',
          slotLaneClass: 'border-gray-100! dark:border-gray-800/60!',
          dayLaneClass: (data: any) =>
            'border-gray-200! dark:border-gray-800!',
          allDayDividerClass:
            'border-b! border-t-0! border-x-0! border-gray-200! p-0! bg-transparent! dark:border-gray-800!',
          allDayHeaderClass:
            'border-0! bg-gray-50! text-xs! font-medium! text-gray-500! dark:border-0! dark:bg-gray-900! dark:text-gray-400!',
        },
      },

      // Body configuration
      height: 'auto',
      borderless: true,
      viewClass:
        'border-t! border-b-0! border-x-0! border-gray-200! dark:border-gray-800!',
      dayHeaderDividerClass:
        'border-b! border-t-0! border-x-0! border-gray-200! p-0! bg-transparent! dark:border-gray-800!',
      slotMinHeight: 56,
      slotHeaderDividerClass:
        'border-e! border-s-0! border-y-0! border-gray-200! dark:border-gray-800!',
      allDayDividerClass:
        'border-b! border-t-0! border-x-0! border-gray-200! p-0! bg-transparent! dark:border-gray-800!',
      eventClass: 'focus:shadow-none',
      nowIndicator: false,
      columnEventClass:
        'bg-transparent! border-0! p-1! shadow-none! hover:shadow-none! focus:outline-none',
      columnEventInnerClass: 'p-0! border-0! bg-transparent! h-full',
      tableHeaderSticky: true,
      tableClass: 'overflow-hidden',
      rowEventClass:
        'bg-transparent! border-0! px-1! py-0.5! shadow-none! hover:shadow-none! focus:outline-none',
      rowEventInnerClass: 'p-0! border-0! bg-transparent!',
      popoverFormat: { month: 'short', day: 'numeric', year: 'numeric' },
      popoverClass:
        'z-99999! w-72 max-w-[calc(100vw-32px)] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-lg dark:border-gray-800 dark:bg-gray-900',
      popoverCloseClass:
        'absolute end-3 top-2.5 flex size-7 cursor-pointer items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus:outline-none dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white',
      popoverCloseContent: {
        html: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4"><path d="M18 6L6 18M6 6l12 12" /></svg>`,
      },

      selectable: false,
      eventDisplay: 'block',
      events: this.events,
      eventClick: (info) => this.handleCalendarEventClick(info),
      eventContent: (arg) => this.renderEventContent(arg),
      datesSet: (arg: any) => {
        this.currentView = arg.view.type;
        requestAnimationFrame(() => {
          const el = this.elRef.nativeElement;
          const chunk = el.querySelector('.ta-toolbar-section:last-child') as HTMLElement;
          if (chunk) {
            this.renderViewSelect(chunk, this.currentView);
          }
        });
      }
    };
  }

  renderViewSelect(containerEl: HTMLElement, activeViewKey: string) {
    if (!containerEl) return;
    const activeOption =
      this.viewOptions.find((v) => v.key === activeViewKey) ||
      this.viewOptions.find((v) => v.key === 'dayGridMonth') ||
      this.viewOptions[0];

    containerEl.innerHTML = `
      <div class="calendar-view-dropdown relative">
        <button
          type="button"
          class="calendar-view-btn flex h-9 w-full min-w-18 items-center justify-center gap-1 rounded-lg border border-gray-300 ps-2.5 pe-1.5 text-xs font-medium text-gray-700 shadow-xs sm:min-w-20 sm:gap-1.5 sm:ps-3 sm:pe-2 sm:text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
          aria-expanded="false"
          aria-haspopup="listbox"
        >
          <span class="calendar-view-label">${activeOption.label}</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="calendar-view-chevron h-4 w-4 transition-transform duration-200 sm:h-4.5 sm:w-4.5">
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </button>
        <div class="calendar-view-menu absolute end-0 z-50 mt-1.5 hidden w-36 max-w-[calc(100vw-32px)] space-y-0.5 rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg sm:w-38 dark:border-gray-700 dark:bg-gray-900">
          ${this.viewOptions
            .map(
              (view) => `
            <button
              type="button"
              data-view-key="${view.key}"
              class="calendar-view-option w-full rounded-lg px-2.5 py-1.5 text-start text-xs text-gray-700 hover:bg-gray-100 sm:text-sm dark:text-gray-300 dark:hover:bg-white/5 ${
                activeViewKey === view.key
                  ? 'bg-gray-100 font-medium dark:bg-white/5'
                  : 'font-normal'
              }"
            >
              ${view.label}
            </button>
          `
            )
            .join('')}
        </div>
      </div>
    `;

    const dropdownContainer = containerEl.querySelector('.calendar-view-dropdown');
    if (!dropdownContainer) return;
    const btn = dropdownContainer.querySelector('.calendar-view-btn') as HTMLElement;
    const menu = dropdownContainer.querySelector('.calendar-view-menu') as HTMLElement;
    const chevron = dropdownContainer.querySelector('.calendar-view-chevron') as HTMLElement;

    if (btn && menu && chevron) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isHidden = menu.classList.contains('hidden');
        document
          .querySelectorAll('.calendar-view-menu')
          .forEach((m) => m.classList.add('hidden'));
        document
          .querySelectorAll('.calendar-view-chevron')
          .forEach((c) => c.classList.remove('rotate-180'));

        if (isHidden) {
          menu.classList.remove('hidden');
          chevron.classList.add('rotate-180');
          btn.setAttribute('aria-expanded', 'true');
        } else {
          menu.classList.add('hidden');
          chevron.classList.remove('rotate-180');
          btn.setAttribute('aria-expanded', 'false');
        }
      });

      dropdownContainer
        .querySelectorAll('.calendar-view-option')
        .forEach((optionBtn) => {
          optionBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const viewKey = (optionBtn as HTMLElement).dataset['viewKey'];
            if (viewKey) {
              this.currentView = viewKey;
              const calApi = this.calendarComponent?.getApi();
              if (calApi && typeof calApi.changeView === 'function') {
                calApi.changeView(viewKey);
              }
            }
            menu.classList.add('hidden');
            chevron.classList.remove('rotate-180');
            btn.setAttribute('aria-expanded', 'false');
          });
        });
    }
  }

  @HostListener('window:click', ['$event'])
  onWindowClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.calendar-view-dropdown')) {
      document
        .querySelectorAll('.calendar-view-menu')
        .forEach((m) => m.classList.add('hidden'));
      document
        .querySelectorAll('.calendar-view-chevron')
        .forEach((c) => c.classList.remove('rotate-180'));
    }
  }

  private loadApplicationEvents(): void {
    this.applicationData.loadSnapshot().subscribe({
      next: (snapshot) => {
        this.events = this.buildEvents(snapshot);
        this.calendarOptions = { ...this.calendarOptions, events: this.events };
        this.isLoading = false;
        this.changeDetector.detectChanges();
      },
      error: (error: unknown) => {
        this.errorMessage = error instanceof Error ? error.message : 'Unable to load calendar data.';
        this.isLoading = false;
        this.changeDetector.detectChanges();
      },
    });
  }

  private buildEvents(snapshot: ApplicationDataSnapshot): CalendarEvent[] {
    const accountsById = new Map(snapshot.accounts.map((account) => [account.id, account]));
    const events: CalendarEvent[] = [];

    for (const user of snapshot.users) {
      const event = this.createCalendarEvent(
        `user-created-${user.id}`,
        `User Created: ${user.name}`,
        user.createdAt,
        'Primary',
        'user',
        [
          { label: 'User', value: user.name },
          { label: 'Account type', value: 'User' },
          { label: 'Unique ID', value: user.uniqueId },
          { label: 'Mobile', value: user.mobile },
          ...(user.agentName ? [{ label: 'Agent', value: user.agentName }] : []),
        ],
      );
      if (event) events.push(event);
    }

    for (const agent of snapshot.agents) {
      const event = this.createCalendarEvent(
        `agent-created-${agent.id}`,
        `Agent Created: ${agent.name}`,
        agent.createdAt,
        'Primary',
        'agent',
        [
          { label: 'Agent', value: agent.name },
          { label: 'Unique ID', value: agent.uniqueId },
          { label: 'Mobile', value: agent.mobile },
        ],
      );
      if (event) events.push(event);
    }

    for (const request of snapshot.requests) {
      const account = accountsById.get(request.userId);
      const accountLabel = account?.type === 'agent' ? 'Agent' : 'User';
      const details = [
        { label: accountLabel, value: account?.name ?? `Account ${request.userId}` },
        ...(account?.agentName ? [{ label: 'Agent', value: account.agentName }] : []),
        { label: 'Status', value: this.toTitleCase(request.status) },
        { label: 'Request type', value: request.type === 'ADD_POINTS' ? 'Add points' : 'Withdrawal' },
        { label: 'Points', value: request.amount },
        { label: 'Request ID', value: `#${request.id}` },
      ];
      const requestColor = request.status === 'PENDING' ? 'Warning' : request.status === 'ACCEPTED' ? 'Success' : 'Danger';
      const createdEvent = this.createCalendarEvent(
        `wallet-request-created-${request.id}`,
        `Wallet Request ${this.toTitleCase(request.status)}: ${account?.name ?? `Account ${request.userId}`}`,
        request.createdAt,
        requestColor,
        'wallet-request',
        details,
      );
      if (createdEvent) events.push(createdEvent);

      const createdTimestamp = Date.parse(request.createdAt);
      const updatedTimestamp = Date.parse(request.updatedAt);
      if (request.status !== 'PENDING' && Number.isFinite(updatedTimestamp) && updatedTimestamp > createdTimestamp) {
        const updatedEvent = this.createCalendarEvent(
          `wallet-request-updated-${request.id}`,
          `Wallet Request ${this.toTitleCase(request.status)}: ${account?.name ?? `Account ${request.userId}`}`,
          request.updatedAt,
          requestColor,
          'wallet-request',
          details,
        );
        if (updatedEvent) events.push(updatedEvent);
      }
    }

    for (const transaction of snapshot.transactions) {
      const account = accountsById.get(transaction.userId);
      const accountLabel = account?.type === 'agent' ? 'Agent' : 'User';
      const event = this.createCalendarEvent(
        `transaction-${transaction.id}`,
        `Transaction ${this.toTitleCase(transaction.type)}: ${account?.name ?? `Account ${transaction.userId}`}`,
        transaction.createdAt,
        transaction.type === 'CREDIT' ? 'Success' : 'Danger',
        'transaction',
        [
          { label: accountLabel, value: account?.name ?? `Account ${transaction.userId}` },
          ...(account?.agentName ? [{ label: 'Agent', value: account.agentName }] : []),
          { label: 'Transaction type', value: this.toTitleCase(transaction.type) },
          { label: 'Source', value: this.formatSource(transaction.source) },
          { label: 'Points', value: transaction.amount },
          { label: 'Balance before', value: transaction.balanceBefore },
          { label: 'Balance after', value: transaction.balanceAfter },
          ...(transaction.requestId ? [{ label: 'Request ID', value: `#${transaction.requestId}` }] : []),
          ...(transaction.description ? [{ label: 'Details', value: transaction.description }] : []),
        ],
      );
      if (event) events.push(event);
    }

    return events.sort((left, right) => left.extendedProps.occurredAt.localeCompare(right.extendedProps.occurredAt));
  }

  private createCalendarEvent(
    id: string,
    title: string,
    timestamp: string | undefined,
    calendar: string,
    source: CalendarEvent['extendedProps']['source'],
    details: { label: string; value: string }[],
  ): CalendarEvent | null {
    if (!timestamp || !Number.isFinite(Date.parse(timestamp))) return null;
    const hasTime = /T\d{2}:\d{2}/.test(timestamp);
    const start = hasTime ? new Date(timestamp).toISOString() : timestamp.slice(0, 10);
    return {
      id,
      title,
      start,
      allDay: !hasTime,
      extendedProps: {
        calendar,
        source,
        dateKey: this.toCalendarDate(timestamp),
        occurredAt: timestamp,
        hasTime,
        details,
      },
    };
  }

  private toCalendarDate(value: string): string {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const date = new Date(value);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private toTitleCase(value: string): string {
    return value.toLowerCase().split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
  }

  private formatSource(value: string): string {
    return value.toLowerCase().split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
  }

  private handleCalendarEventClick(info: any): void {
    info.jsEvent?.preventDefault();

    const eventId = String(info.event.id);
    const event = this.events.find((item) => String(item.id) === eventId);
    if (!event) return;
    this.selectedEvent = event;
    this.isEventDetailsOpen = true;
    this.changeDetector.detectChanges();
  }

  closeDateEvents(): void {
    this.isEventDetailsOpen = false;
    this.selectedEvent = null;
    this.changeDetector.detectChanges();
  }

  get selectedDateValue(): Date | null {
    const dateKey = this.selectedEvent?.extendedProps.dateKey;
    if (!dateKey) return null;
    const [year, month, day] = dateKey.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  renderEventContent(eventInfo: any) {
    const title = this.escapeHtml(String(eventInfo.event.title || 'Calendar event'));
    const source = String(eventInfo.event.extendedProps?.source || 'user');
    const status = String(eventInfo.event.extendedProps?.calendar || 'Primary').toLowerCase();
    const colorClass = source === 'agent'
      ? 'calendar-event-purple'
      : status === 'warning'
        ? 'calendar-event-warning'
        : status === 'success'
          ? 'calendar-event-success'
          : status === 'danger'
            ? 'calendar-event-danger'
            : 'calendar-event-primary';
    return {
      html: `<span class="calendar-event-bar ${colorClass}" title="${title}">${title}</span>`,
    };
  }

  private escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, (character) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    })[character] ?? character);
  }
}
