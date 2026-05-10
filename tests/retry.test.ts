import { exponentialBackoff } from '../src/utils/retry';

jest.setTimeout(15000);

describe('Retry Logic', () => {

  it('should succeed on first attempt', async () => {
    const mockFn = jest.fn().mockResolvedValue('success');

    const result = await exponentialBackoff(mockFn, {
      maxRetries: 3,
      initialDelay: 100,
    });

    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and eventually succeed', async () => {
    const mockFn = jest
      .fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('success');

    const result = await exponentialBackoff(mockFn, {
      maxRetries: 3,
      initialDelay: 100,
    });

    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(3);
  });

  it('should throw after max retries exhausted', async () => {
    const mockFn = jest.fn().mockRejectedValue(new Error('always fails'));

    await expect(
      exponentialBackoff(mockFn, {
        maxRetries: 3,
        initialDelay: 100,
      })
    ).rejects.toThrow('always fails');

    expect(mockFn).toHaveBeenCalledTimes(3);
  });

});