import { bucketizeRainfallMm, resolveWeatherForLocation } from '../weatherAdapter.js';

describe('Weather Adapter', () => {
  beforeEach(() => {
    global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;
  });

  it('buckets rainfall totals deterministically', () => {
    expect(bucketizeRainfallMm(4.9)).toBe('low');
    expect(bucketizeRainfallMm(5)).toBe('moderate');
    expect(bucketizeRainfallMm(20)).toBe('moderate');
    expect(bucketizeRainfallMm(20.1)).toBe('high');
  });

  it('resolves a location into derived temperature and rainfall buckets', async () => {
    (global.fetch as jest.MockedFunction<typeof fetch>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            {
              latitude: 17.97,
              longitude: 79.59,
              name: 'Warangal',
              admin1: 'Telangana',
              country: 'India'
            }
          ]
        })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          daily: {
            time: Array.from({ length: 14 }, (_, index) => `2026-04-${String(index + 1).padStart(2, '0')}`),
            temperature_2m_max: Array(14).fill(32),
            temperature_2m_min: Array(14).fill(24),
            precipitation_sum: Array(14).fill(2)
          }
        })
      } as Response);

    const weather = await resolveWeatherForLocation('Warangal, Telangana');

    expect(weather).not.toBeNull();
    expect(weather).toMatchObject({
      locationInput: 'Warangal, Telangana',
      resolvedLocation: 'Warangal, Telangana, India',
      expectedTempAvg: 28,
      expectedRainfall: 'high',
      rainfallMm14d: 28,
      weatherConfidence: 100,
      source: 'open-meteo'
    });
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('returns null when the location cannot be geocoded', async () => {
    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [] })
    } as Response);

    await expect(resolveWeatherForLocation('Unknown Village')).resolves.toBeNull();
  });
});