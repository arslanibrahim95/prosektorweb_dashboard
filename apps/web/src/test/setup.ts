import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock Next.js router
vi.mock("next/router", () => ({
  useRouter: () => ({
    route: "/",
    pathname: "/",
    query: {},
    asPath: "/",
    push: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
    beforePopState: vi.fn(),
    events: {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    },
    isFallback: false,
    isLocaleDomain: false,
    isReady: true,
    isPreview: false,
  }),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next/head
vi.mock("next/head", () => {
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => children,
  };
});

// Setup matchMedia mock
global.matchMedia =
  global.matchMedia ||
  function () {
    return {
      matches: false,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };
  };

// Setup localStorage mock
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Setup sessionStorage mock
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, "sessionStorage", {
  value: sessionStorageMock,
});

// Setup IntersectionObserver mock
class IntersectionObserverMock {
  constructor(
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit
  ) {
    this.callback = callback;
    this.options = options;
  }

  callback: IntersectionObserverCallback;
  options?: IntersectionObserverInit;
  elements: Element[] = [];

  observe(element: Element) {
    this.elements.push(element);
  }

  unobserve(element: Element) {
    this.elements = this.elements.filter((el) => el !== element);
  }

  disconnect() {
    this.elements = [];
  }

  trigger(entries: IntersectionObserverEntry[]) {
    this.callback(entries, this);
  }
}

global.IntersectionObserver =
  IntersectionObserverMock as unknown as typeof IntersectionObserver;

// Setup ResizeObserver mock
class ResizeObserverMock {
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }

  callback: ResizeObserverCallback;
  elements: Element[] = [];

  observe(element: Element) {
    this.elements.push(element);
  }

  unobserve(element: Element) {
    this.elements = this.elements.filter((el) => el !== element);
  }

  disconnect() {
    this.elements = [];
  }

  trigger(entries: ResizeObserverEntry[]) {
    this.callback(entries, this);
  }
}

global.ResizeObserver =
  ResizeObserverMock as unknown as typeof ResizeObserver;

// Setup PerformanceObserver mock
class PerformanceObserverMock {
  constructor(callback: PerformanceObserverCallback) {
    this.callback = callback;
  }

  callback: PerformanceObserverCallback;
  entryTypes: string[] = [];

  observe(options?: PerformanceObserverInit) {
    if (options?.entryTypes) {
      this.entryTypes.push(...options.entryTypes);
    }
    if (options?.type) {
      this.entryTypes.push(options.type);
    }
  }

  disconnect() {
    this.entryTypes = [];
  }

  takeRecords(): PerformanceEntryList {
    return [];
  }
}

global.PerformanceObserver =
  PerformanceObserverMock as unknown as typeof PerformanceObserver;

// Setup requestIdleCallback mock
global.requestIdleCallback =
  global.requestIdleCallback ||
  function (callback: IdleRequestCallback) {
    return setTimeout(callback, 1) as unknown as number;
  };

global.cancelIdleCallback =
  global.cancelIdleCallback ||
  function (handle: number) {
    clearTimeout(handle);
  };

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
  localStorageMock.getItem.mockReturnValue(null);
});

// Extend expect matchers
expect.extend({
  toHaveBeenCalledBefore(received: vi.Mock, expected: vi.Mock) {
    const receivedCalls = received.mock.invocationCallOrder;
    const expectedCalls = expected.mock.invocationCallOrder;

    const pass =
      receivedCalls.length > 0 &&
      expectedCalls.length > 0 &&
      receivedCalls[0] < expectedCalls[0];

    return {
      pass,
      message: () =>
        pass
          ? `expected ${received.getMockName()} not to have been called before ${expected.getMockName()}`
          : `expected ${received.getMockName()} to have been called before ${expected.getMockName()}`,
    };
  },
});
