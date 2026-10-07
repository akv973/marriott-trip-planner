import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { App } from '../../app/App';
import * as catalog from '../../lib/catalog/foundation';
import { validateFoundation } from '../../lib/validation/foundation';

describe('Validated foundation and application shell', () => {
  it('loads the shipped collections and renders an explicit empty catalog', () => {
    const result = catalog.loadFoundation();
    expect(result.success).toBe(true);
    if (!result.success) throw new Error('Shipped foundation should validate.');
    expect(result.data.properties).toHaveLength(0);
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Your next journey');
    expect(screen.getByText('Catalog not yet populated')).toBeInTheDocument();
    expect(screen.getByText(/contains no property listings or pricing/)).toBeInTheDocument();
    expect(screen.getAllByText('Planned', { exact: true })).toHaveLength(3);
  });

  it('provides a skip link and navigation with real document targets', () => {
    render(<App />);
    const skip = screen.getByRole('link', { name: 'Skip to content' });
    expect(skip).toHaveAttribute('href', '#main');
    const targets = screen.getAllByRole('link').map((link) => link.getAttribute('href'));
    for (const href of targets) {
      expect(href).toMatch(/^#[a-z]+$/);
      expect(document.getElementById(href!.slice(1))).not.toBeNull();
    }
    fireEvent.click(screen.getByRole('link', { name: 'What’s next' }));
    expect(screen.getByRole('heading', { name: 'Taking shape, one stage at a time.' })).toBeInTheDocument();
  });

  it('shows an honest fallback when validation fails', () => {
    const invalid = validateFoundation(null);
    const spy = vi.spyOn(catalog, 'loadFoundation').mockReturnValue(invalid);
    try {
      render(<App />);
      expect(screen.getByRole('heading', { name: 'The planner couldn’t load.' })).toBeInTheDocument();
      expect(screen.queryByText('Catalog not yet populated')).not.toBeInTheDocument();
    } finally {
      spy.mockRestore();
    }
  });
});
