import { describe, expect, it } from 'vitest';
import '../../src/index';
import { lastNumberInUrl, numbersIn } from '../../src/steps/data.steps';

describe('numbers in texts and addresses', () => {
  it('are kept as written', () => {
    expect(numbersIn('Order #10234 was created')).toEqual(['10234']);
    expect(numbersIn('12,50 € for 1.234,56 items')).toEqual(['12,50', '1.234,56']);
    expect(numbersIn('Order 10234, created on 21.10.2026')).toEqual(['10234', '21.10.2026']);
    expect(numbersIn('Ticket 00042')).toEqual(['00042']);
    expect(numbersIn('Order-123')).toEqual(['123']);
    expect(numbersIn('Order created')).toEqual([]);
  });

  it('come from the path of an address, else from its query', () => {
    expect(lastNumberInUrl('http://localhost:3000/api/v2/orders/17')).toBe('17');
    expect(lastNumberInUrl('http://localhost:3000/orders/17?page=2')).toBe('17');
    expect(lastNumberInUrl('http://localhost:3000/orders?id=17')).toBe('17');
    expect(lastNumberInUrl('http://localhost:3000/#/orders/17')).toBe('17');
    expect(lastNumberInUrl('http://localhost:3000/orders/new')).toBeUndefined();
    expect(lastNumberInUrl('about:blank')).toBeUndefined();
  });
});
