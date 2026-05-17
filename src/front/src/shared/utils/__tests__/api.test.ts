// Els interceptors d'axios es capturen amb vi.hoisted per garantir
// que la captura funciona abans que el mòdul api.ts s'importi.
const handlers = vi.hoisted(() => ({
  requestFulfilled: undefined as
    | ((config: { headers: Record<string, string> }) => {
        headers: Record<string, string>;
      })
    | undefined,
  responseRejected: undefined as
    | ((error: unknown) => Promise<never>)
    | undefined,
}));

vi.mock("axios", () => ({
  default: {
    create: vi.fn(() => ({
      interceptors: {
        request: {
          use: vi.fn(
            (fn: (config: { headers: Record<string, string> }) => unknown) => {
              handlers.requestFulfilled = fn as typeof handlers.requestFulfilled;
            },
          ),
        },
        response: {
          use: vi.fn((_: unknown, fn: (error: unknown) => Promise<never>) => {
            handlers.responseRejected = fn;
          }),
        },
      },
    })),
  },
}));

// Importar per efecte lateral: registra els interceptors sobre el mock d'axios
import "@/shared/utils/api";

// Helper que crea un localStorage mockat fresc per a cada test
function makeLocalStorageMock() {
  const store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, val: string) => {
      store[key] = val;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k]);
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
}

describe("api.ts — interceptors", () => {
  let storageMock: ReturnType<typeof makeLocalStorageMock>;

  beforeEach(() => {
    storageMock = makeLocalStorageMock();
    // 3.2: Mockejar localStorage i window.location per evitar errors en jsdom
    vi.stubGlobal("localStorage", storageMock);
    vi.stubGlobal("location", { href: "" });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("interceptor de request", () => {
    it("afegeix la capçalera Authorization quan hi ha token a localStorage", () => {
      storageMock.setItem("token", "test-token-123");

      const config = { headers: {} as Record<string, string> };
      const result = handlers.requestFulfilled!(config);

      expect(result.headers["Authorization"]).toBe("Bearer test-token-123");
    });

    it("no afegeix Authorization quan no hi ha token a localStorage", () => {
      const config = { headers: {} as Record<string, string> };
      const result = handlers.requestFulfilled!(config);

      expect(result.headers["Authorization"]).toBeUndefined();
    });
  });

  describe("interceptor de response (401)", () => {
    it("neteja localStorage en rebre un error 401", async () => {
      storageMock.setItem("token", "tok");
      storageMock.setItem("username", "usuari");
      storageMock.setItem("userRole", "COACH");
      storageMock.setItem("userId", "1");

      const error = { response: { status: 401 } };

      await expect(handlers.responseRejected!(error)).rejects.toBeDefined();

      expect(storageMock.getItem("token")).toBeNull();
      expect(storageMock.getItem("username")).toBeNull();
      expect(storageMock.getItem("userRole")).toBeNull();
      expect(storageMock.getItem("userId")).toBeNull();
    });

    it("no elimina localStorage si l'error no és 401", async () => {
      storageMock.setItem("token", "tok");

      const error = { response: { status: 500 } };

      await expect(handlers.responseRejected!(error)).rejects.toBeDefined();

      expect(storageMock.getItem("token")).toBe("tok");
    });
  });
});
