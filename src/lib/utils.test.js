import {
  cn,
  formatCurrency,
  formatDate,
  formatTime,
  getToday,
  getMonthName,
  calculateDays,
  generateId,
  debounce,
  throttle,
  getInitials,
  isValidPhone,
  isValidEmail,
  getGreeting,
  getWeekDates,
  groupBy,
  sortBy,
  filterBySearch,
} from './utils';

// ── cn (classname merger) ────────────────────────────────────────────────
describe('cn', () => {
  it('merges tailwind classes correctly', () => {
    expect(cn('px-4 py-2', 'px-6')).toBe('py-2 px-6');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible');
  });

  it('returns empty string for no inputs', () => {
    expect(cn()).toBe('');
  });
});

// ── formatCurrency ───────────────────────────────────────────────────────
describe('formatCurrency', () => {
  it('formats positive numbers with rupee symbol', () => {
    expect(formatCurrency(100)).toBe('₹100.00');
    expect(formatCurrency(99.5)).toBe('₹99.50');
  });

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('₹0.00');
  });

  it('handles NaN gracefully', () => {
    expect(formatCurrency('abc')).toBe('₹0.00');
  });

  it('handles negative numbers', () => {
    expect(formatCurrency(-50)).toBe('₹-50.00');
  });

  it('handles string numbers', () => {
    expect(formatCurrency('42.5')).toBe('₹42.50');
  });
});

// ── formatDate ───────────────────────────────────────────────────────────
describe('formatDate', () => {
  it('formats date to en-IN locale', () => {
    const result = formatDate('2024-03-15');
    expect(result).toContain('Mar');
    expect(result).toContain('2024');
  });

  it('accepts custom options', () => {
    const result = formatDate('2024-03-15', { year: 'numeric' });
    expect(result).toContain('2024');
    expect(result).toContain('Mar'); // defaults are preserved, options extend them
  });
});

// ── formatTime ───────────────────────────────────────────────────────────
describe('formatTime', () => {
  it('formats time with hours and minutes', () => {
    const date = new Date(2024, 0, 1, 9, 30, 0);
    const result = formatTime(date);
    expect(result).toContain('09');
    expect(result).toContain('30');
  });
});

// ── getToday ─────────────────────────────────────────────────────────────
describe('getToday', () => {
  it('returns today as YYYY-MM-DD string', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(getToday()).toBe(today);
  });
});

// ── getMonthName ─────────────────────────────────────────────────────────
describe('getMonthName', () => {
  it('returns correct month names', () => {
    expect(getMonthName(1)).toBe('January');
    expect(getMonthName(6)).toBe('June');
    expect(getMonthName(12)).toBe('December');
  });

  it('returns empty string for invalid month', () => {
    expect(getMonthName(0)).toBe('');
    expect(getMonthName(13)).toBe('');
  });
});

// ── calculateDays ────────────────────────────────────────────────────────
describe('calculateDays', () => {
  it('returns 1 for same day', () => {
    expect(calculateDays('2024-01-01', '2024-01-01')).toBe(1);
  });

  it('calculates days between dates inclusive', () => {
    expect(calculateDays('2024-01-01', '2024-01-10')).toBe(10);
  });

  it('handles month boundaries', () => {
    expect(calculateDays('2024-01-31', '2024-02-01')).toBe(2);
  });

  it('works regardless of order', () => {
    expect(calculateDays('2024-01-10', '2024-01-01')).toBe(10);
  });
});

// ── generateId ───────────────────────────────────────────────────────────
describe('generateId', () => {
  it('generates a non-empty string', () => {
    expect(typeof generateId()).toBe('string');
    expect(generateId().length).toBeGreaterThan(0);
  });

  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });
});

// ── debounce ─────────────────────────────────────────────────────────────
describe('debounce', () => {
  jest.useFakeTimers();

  it('delays function execution', () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 300);

    debounced();
    expect(fn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('cancels previous pending calls', () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 300);

    debounced();
    debounced();
    debounced();

    jest.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

// ── throttle ────────────────────────────────────────────────────────────
describe('throttle', () => {
  jest.useFakeTimers();

  it('calls immediately first time', () => {
    const fn = jest.fn();
    const throttled = throttle(fn, 300);

    throttled();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('ignores calls within the limit', () => {
    const fn = jest.fn();
    const throttled = throttle(fn, 300);

    throttled();
    throttled();
    throttled();

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('allows next call after limit', () => {
    const fn = jest.fn();
    const throttled = throttle(fn, 300);

    throttled();
    jest.advanceTimersByTime(300);
    throttled();

    expect(fn).toHaveBeenCalledTimes(2);
  });
});

// ── getInitials ─────────────────────────────────────────────────────────
describe('getInitials', () => {
  it('returns initials from full name', () => {
    expect(getInitials('John Doe')).toBe('JD');
  });

  it('returns single initial for one-word name', () => {
    expect(getInitials('John')).toBe('J');
  });

  it('works with three names', () => {
    expect(getInitials('John Michael Doe')).toBe('JM');
  });

  it('returns ? for empty input', () => {
    expect(getInitials('')).toBe('?');
    expect(getInitials(null)).toBe('?');
    expect(getInitials(undefined)).toBe('?');
  });
});

// ── isValidPhone ─────────────────────────────────────────────────────────
describe('isValidPhone', () => {
  it('validates 10-digit Indian phone numbers', () => {
    expect(isValidPhone('9876543210')).toBe(true);
    expect(isValidPhone('9123456789')).toBe(true);
  });

  it('rejects invalid phone numbers', () => {
    expect(isValidPhone('1234567890')).toBe(false); // starts with 1
    expect(isValidPhone('987654321')).toBe(false);   // 9 digits
    expect(isValidPhone('98765432100')).toBe(false);  // 11 digits
    expect(isValidPhone('')).toBe(false);
  });

  it('strips non-digit characters', () => {
    expect(isValidPhone('  98765 43210 ')).toBe(true);
  });
});

// ── isValidEmail ─────────────────────────────────────────────────────────
describe('isValidEmail', () => {
  it('validates correct emails', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('user.name@domain.co.in')).toBe(true);
  });

  it('rejects invalid emails', () => {
    expect(isValidEmail('not-an-email')).toBe(false);
    expect(isValidEmail('@domain.com')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });
});

// ── getGreeting ──────────────────────────────────────────────────────────
describe('getGreeting', () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('returns Good Morning before noon', () => {
    jest.setSystemTime(new Date(2024, 0, 1, 9, 0, 0));
    expect(getGreeting()).toBe('Good Morning');
  });

  it('returns Good Afternoon between noon and 5pm', () => {
    jest.setSystemTime(new Date(2024, 0, 1, 14, 0, 0));
    expect(getGreeting()).toBe('Good Afternoon');
  });

  it('returns Good Evening after 5pm', () => {
    jest.setSystemTime(new Date(2024, 0, 1, 19, 0, 0));
    expect(getGreeting()).toBe('Good Evening');
  });
});

// ── getWeekDates ────────────────────────────────────────────────────────
describe('getWeekDates', () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('returns 7 date strings', () => {
    jest.setSystemTime(new Date(2024, 0, 15)); // Monday
    const dates = getWeekDates();
    expect(dates).toHaveLength(7);
  });

  it('all dates are in YYYY-MM-DD format', () => {
    jest.setSystemTime(new Date(2024, 0, 15));
    const dates = getWeekDates();
    dates.forEach(date => {
      expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
});

// ── groupBy ──────────────────────────────────────────────────────────────
describe('groupBy', () => {
  const items = [
    { type: 'A', val: 1 },
    { type: 'B', val: 2 },
    { type: 'A', val: 3 },
  ];

  it('groups by a key string', () => {
    const grouped = groupBy(items, 'type');
    expect(grouped).toEqual({
      A: [{ type: 'A', val: 1 }, { type: 'A', val: 3 }],
      B: [{ type: 'B', val: 2 }],
    });
  });

  it('groups by a function', () => {
    const grouped = groupBy(items, item => item.val > 1 ? 'high' : 'low');
    expect(grouped.low).toHaveLength(1);
    expect(grouped.high).toHaveLength(2);
  });
});

// ── sortBy ───────────────────────────────────────────────────────────────
describe('sortBy', () => {
  it('sorts by a key ascending', () => {
    const items = [{ n: 3 }, { n: 1 }, { n: 2 }];
    const sorted = sortBy(items, 'n');
    expect(sorted.map(i => i.n)).toEqual([1, 2, 3]);
  });

  it('sorts descending', () => {
    const items = [{ n: 3 }, { n: 1 }, { n: 2 }];
    const sorted = sortBy(items, 'n', 'desc');
    expect(sorted.map(i => i.n)).toEqual([3, 2, 1]);
  });

  it('sorts by function key', () => {
    const items = [{ n: 3 }, { n: 1 }, { n: 2 }];
    const sorted = sortBy(items, item => item.n);
    expect(sorted.map(i => i.n)).toEqual([1, 2, 3]);
  });

  it('does not mutate the original array', () => {
    const arr = [{ n: 3 }, { n: 1 }, { n: 2 }];
    const sorted = sortBy(arr, 'n');
    expect(arr).toEqual([{ n: 3 }, { n: 1 }, { n: 2 }]);
    expect(sorted.map(i => i.n)).toEqual([1, 2, 3]);
  });
});

// ── filterBySearch ───────────────────────────────────────────────────────
describe('filterBySearch', () => {
  const items = [
    { name: 'Alice', city: 'Mumbai' },
    { name: 'Bob', city: 'Delhi' },
    { name: 'Charlie', city: 'Mumbai' },
  ];

  it('returns all items when search is empty', () => {
    expect(filterBySearch(items, '', ['name'])).toHaveLength(3);
  });

  it('filters by a key', () => {
    const filtered = filterBySearch(items, 'ali', ['name']);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('Alice');
  });

  it('filters across multiple keys', () => {
    const filtered = filterBySearch(items, 'mumbai', ['name', 'city']);
    expect(filtered).toHaveLength(2);
  });

  it('handles function keys', () => {
    const filtered = filterBySearch(
      [{ name: 'Alice' }, { name: 'Bob' }],
      'ali',
      [item => item.name]
    );
    expect(filtered).toHaveLength(1);
  });

  it('returns original array if no search term', () => {
    expect(filterBySearch(items, null, ['name'])).toBe(items);
  });
});
