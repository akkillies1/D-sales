import { describe, test, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { FunnelKanban } from '../FunnelKanban';

describe('FunnelKanban mobile scroll support', () => {
  test('keeps a shrinkable horizontal scroll container available in the pipeline view', () => {
    const html = renderToStaticMarkup(
      <FunnelKanban
        leads={[]}
        onEditLead={() => undefined}
        onMoveStage={() => undefined}
      />
    );

    expect(html).toContain('overflow-x-auto');
    expect(html).toContain('min-w-0');
  });
});
