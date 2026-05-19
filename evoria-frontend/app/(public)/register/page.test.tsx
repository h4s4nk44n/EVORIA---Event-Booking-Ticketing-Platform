import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const replace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(''),
  usePathname: () => '/register',
}));

const register = vi.fn();
vi.mock('@/state/auth', () => ({
  useAuth: () => ({ login: vi.fn(), register, logout: vi.fn(), auth: null, setRole: vi.fn() }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import RegisterPage from './page';

describe('RegisterPage', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    replace.mockReset();
    register.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  async function fillValidForm() {
    await userEvent.type(screen.getByLabelText(/full name/i), 'Selin Demir');
    await userEvent.type(screen.getByLabelText(/email/i), 'selin@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'super-strong-pw');
    // Tick the T&C checkbox.
    await userEvent.click(screen.getByLabelText(/i agree to the terms/i));
  }

  it('renders the form with the attendee role selected by default', () => {
    render(<RegisterPage />);
    expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create attendee account/i })).toBeInTheDocument();
  });

  it('swaps the CTA when the organizer role is chosen', async () => {
    render(<RegisterPage />);
    // The role tile button accessible name combines the label and its description.
    await userEvent.click(screen.getByRole('button', { name: /Organizer\s+Publish events/ }));
    expect(screen.getByRole('button', { name: /create organizer account/i })).toBeInTheDocument();
  });

  it('POSTs to /auth/register and redirects on success', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ token: 'new.jwt.token' }), {
        status: 201,
        headers: { 'content-type': 'application/json' },
      }),
    );

    render(<RegisterPage />);
    await fillValidForm();
    await userEvent.click(screen.getByRole('button', { name: /create attendee account/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain('/auth/register');
    expect(JSON.parse(init.body)).toEqual({
      name: 'Selin Demir',
      email: 'selin@example.com',
      password: 'super-strong-pw',
      role: 'attendee',
    });
    expect(window.localStorage.getItem('token')).toBe('new.jwt.token');
    expect(register).toHaveBeenCalledWith({
      role: 'attendee',
      name: 'Selin Demir',
      email: 'selin@example.com',
    });
    expect(replace).toHaveBeenCalledWith('/');
  });

  it('surfaces field-level validation errors from a 400 response', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ errors: { email: 'already in use' }, message: 'Validation failed' }),
        { status: 400, headers: { 'content-type': 'application/json' } },
      ),
    );

    render(<RegisterPage />);
    await fillValidForm();
    await userEvent.click(screen.getByRole('button', { name: /create attendee account/i }));

    expect(await screen.findByText(/already in use/i)).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it('refuses to submit without the terms checkbox', async () => {
    render(<RegisterPage />);
    await userEvent.type(screen.getByLabelText(/full name/i), 'A');
    await userEvent.type(screen.getByLabelText(/email/i), 'a@b.co');
    await userEvent.type(screen.getByLabelText(/password/i), 'longenough-pw');
    await userEvent.click(screen.getByRole('button', { name: /create attendee account/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/agree to the terms/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('refuses to submit when the password is too short', async () => {
    render(<RegisterPage />);
    await userEvent.type(screen.getByLabelText(/full name/i), 'A');
    await userEvent.type(screen.getByLabelText(/email/i), 'a@b.co');
    await userEvent.type(screen.getByLabelText(/password/i), 'short');
    await userEvent.click(screen.getByLabelText(/i agree to the terms/i));
    await userEvent.click(screen.getByRole('button', { name: /create attendee account/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/at least 10 characters/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
