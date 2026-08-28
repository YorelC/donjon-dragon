import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Nav } from "./nav";
import { useAuthStore } from "@/shared/stores/auth.store";
import * as useReceivedCountModule from "@/shared/queries/use-received-count";

vi.mock("@/shared/hooks/use-logout", () => ({
  useLogout: () => vi.fn(),
}));

vi.mock("@/shared/queries/use-received-count", async () => {
  const actual = await vi.importActual<typeof useReceivedCountModule>(
    "@/shared/queries/use-received-count",
  );
  return { ...actual, useReceivedCount: vi.fn() };
});

const mockedUseReceivedCount = vi.mocked(useReceivedCountModule.useReceivedCount);

type ReceivedCountResult = ReturnType<typeof useReceivedCountModule.useReceivedCount>;

function stubReceivedCount(count: number | undefined) {
  mockedUseReceivedCount.mockReturnValue({
    data: count === undefined ? undefined : { count },
  } as ReceivedCountResult);
}

const authenticatedUser = {
  id: "123",
  email: "test@example.com",
  displayName: "Test",
  createdAt: new Date().toISOString(),
  emailVerified: true,
};

function renderNav() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Nav />
      </BrowserRouter>
    </QueryClientProvider>,
  );
}

describe("Nav", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null });
    stubReceivedCount(0);
  });

  it("should render null when not authenticated", () => {
    useAuthStore.setState({ user: null });

    const { container } = renderNav();

    expect(container.firstChild).toBeNull();
  });

  it("should render profile link when authenticated", () => {
    useAuthStore.setState({ user: authenticatedUser });

    renderNav();

    const profileLink = screen.getByRole("link", { name: /Profil/i });
    expect(profileLink).toBeInTheDocument();
    expect(profileLink).toHaveAttribute("href", "/profile");
  });

  // L'accueil se rejoint par le losange de marque, pas par un onglet.
  it("should not render a home link", () => {
    useAuthStore.setState({ user: authenticatedUser });

    renderNav();

    expect(
      screen.queryByRole("link", { name: /Accueil/i }),
    ).not.toBeInTheDocument();
  });

  it("should stamp the pending friend requests count on the profile tab", () => {
    useAuthStore.setState({ user: authenticatedUser });
    stubReceivedCount(3);

    renderNav();

    const profileLink = screen.getByRole("link", { name: /Profil/i });
    expect(profileLink).toHaveTextContent("3");
  });

  it("should not stamp any count when no request is pending", () => {
    useAuthStore.setState({ user: authenticatedUser });

    renderNav();

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("should render a mobile menu trigger button", () => {
    useAuthStore.setState({ user: authenticatedUser });

    renderNav();

    expect(screen.getByRole("button", { name: /menu/i })).toBeInTheDocument();
  });

  it("should open the sheet with nav links when the trigger is clicked", async () => {
    const user = userEvent.setup();
    useAuthStore.setState({ user: authenticatedUser });

    renderNav();

    const trigger = screen.getByRole("button", { name: /menu/i });
    await user.click(trigger);

    const links = screen.getAllByRole("link", { name: /Campagnes/i });
    expect(links.length).toBeGreaterThan(0);

    const logoutButtons = screen.getAllByRole("button", {
      name: /Déconnexion/i,
    });
    expect(logoutButtons.length).toBeGreaterThan(0);
  });
});
