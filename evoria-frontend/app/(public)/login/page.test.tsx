import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ---------------------------------------------------------------------------
// Module mocks – done at the top so the page imports them when required.
// ---------------------------------------------------------------------------

const replace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(''),
  usePathname: () => '/login',
}));

const login = vi.fn();
vi.mock('@/state/auth', () => ({
  useAuth: () => ({ login, register: vi.fn(), logout: vi.fn(), auth: null, setRole: vi.fn() }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import LoginPage from './page';

describe('LoginPage', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    replace.mockReset();
    login.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the login form', () => {
    render(<LoginPage />);
    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('POSTs credentials and redirects on success', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ token: 'jwt.token.value' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    render(<LoginPage />);
    await userEvent.type(screen.getByLabelText(/email/i), 'mira@evoria.live');
    await userEvent.type(screen.getByLabelText('Password'), 'secret-pass');
    await userEvent.click(screen.getByRole('button', { name: /^log in$/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain('/auth/login');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ email: 'mira@evoria.live', password: 'secret-pass' });

    expect(window.localStorage.getItem('token')).toBe('jwt.token.value');
    expect(login).toHaveBeenCalledWith('mira@evoria.live');
    expect(replace).toHaveBeenCalledWith('/');
  });

  it('shows an error message on 401', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }));

    render(<LoginPage />);
    await userEvent.type(screen.getByLabelText(/email/i), 'bad@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'whatever');
    await userEvent.click(screen.getByRole('button', { name: /^log in$/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/invalid email or password/i);
    expect(replace).not.toHaveBeenCalled();
  });

  it('falls back to local-only login for demo accounts when the API is offline', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    render(<LoginPage />);
    // Click the first demo button (Attendee).
    const demoButtons = screen.getAllByText(/registered via sign-up form/i);
    await userEvent.click(demoButtons[0].closest('button') as HTMLButtonElement);

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith('deniz.a@gmail.com');
    });
    expect(replace).toHaveBeenCalledWith('/');
  });

  it('refuses to submit when fields are empty', async () => {
    render(<LoginPage />);
    await userEvent.click(screen.getByRole('button', { name: /^log in$/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/email and password are required/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
