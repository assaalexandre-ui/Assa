import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { DeleteButton } from './DeleteButton';

afterEach(cleanup);

describe('DeleteButton (suppression en deux clics)', () => {
  it("demande une confirmation avant d'appeler l'action", async () => {
    const action = vi.fn(async () => {});
    render(<DeleteButton action={action} />);
    const b = screen.getByRole('button', { name: 'Supprimer' });
    fireEvent.click(b);
    expect(action).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Confirmer la suppression' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer la suppression' }));
    expect(action).toHaveBeenCalledTimes(1);
  });
});
