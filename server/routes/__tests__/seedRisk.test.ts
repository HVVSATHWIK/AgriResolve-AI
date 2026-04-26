/**
 * Seed Risk Route Tests
 */

import type { Express } from 'express';
import express = require('express');
import request = require('supertest');

import { seedRiskRouter } from '../seedRisk.js';
import { resolveWeatherForLocation } from '../../services/weatherAdapter.js';

jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}));

jest.mock('../../services/weatherAdapter.js', () => ({
  resolveWeatherForLocation: jest.fn()
}));

const mockedResolveWeatherForLocation = resolveWeatherForLocation as jest.MockedFunction<typeof resolveWeatherForLocation>;

describe('Seed Risk Route', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/seed-risk', seedRiskRouter);
    mockedResolveWeatherForLocation.mockReset();
  });

  it('returns a deterministic risk response for a valid cotton scenario', async () => {
    const response = await request(app)
      .post('/api/seed-risk')
      .send({
        crop: 'cotton',
        location: 'Warangal, Telangana',
        soilType: 'clay',
        expectedRainfall: 'high',
        expectedTempAvg: 28
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      deterministic: true,
      input: {
        crop: 'cotton',
        location: 'Warangal, Telangana',
        soilType: 'clay',
        expectedRainfall: 'high',
        expectedTempAvg: 28,
        seedBrand: null
      },
      weather: {
        weather_source: 'manual',
        rainfall_bucket: 'high',
        rainfall_mm: null
      },
      result: {
        risk_score: 35,
        risk_level: 'High',
        primary_risk_driver: 'Soil Compatibility'
      }
    });

    expect(response.body.result.key_factors).toHaveLength(2);
    expect(response.body.result.explanation).toContain('cotton');
  });

  it('returns validation errors for missing required fields', async () => {
    const response = await request(app)
      .post('/api/seed-risk')
      .send({
        crop: 'paddy',
        location: 'Kurnool'
      });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      code: 'VALIDATION_ERROR',
      message: 'Invalid seed risk request.'
    });
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'soilType' }),
      ])
    );
  });

  it('derives weather from location when manual weather is omitted', async () => {
    mockedResolveWeatherForLocation.mockResolvedValue({
      locationInput: 'Warangal, Telangana',
      resolvedLocation: 'Warangal, Telangana, India',
      latitude: 17.97,
      longitude: 79.59,
      expectedTempAvg: 28,
      expectedRainfall: 'high',
      rainfallMm14d: 28,
      weatherConfidence: 72,
      source: 'open-meteo',
      warnings: []
    });

    const response = await request(app)
      .post('/api/seed-risk')
      .send({
        crop: 'cotton',
        location: 'Warangal, Telangana',
        soilType: 'clay'
      });

    expect(mockedResolveWeatherForLocation).toHaveBeenCalledWith('Warangal, Telangana');
    expect(response.status).toBe(200);
    expect(response.body.weather).toMatchObject({
      weather_source: 'api',
      resolvedLocation: 'Warangal, Telangana, India',
      expectedTempAvg: 28,
      expectedRainfall: 'high',
      rainfall_bucket: 'high',
      rainfall_mm: 28,
      weatherConfidence: 72
    });
    expect(response.body.result).toMatchObject({
      risk_score: 35,
      risk_level: 'High',
      confidence_score: 72,
      primary_risk_driver: 'Soil Compatibility'
    });
  });

  it('distinguishes cotton from paddy in identical clay and heavy-rain conditions', async () => {
    const cotton = await request(app)
      .post('/api/seed-risk')
      .send({
        crop: 'cotton',
        location: 'Same field',
        soilType: 'clay',
        expectedRainfall: 'high',
        expectedTempAvg: 28
      });

    const paddy = await request(app)
      .post('/api/seed-risk')
      .send({
        crop: 'paddy',
        location: 'Same field',
        soilType: 'clay',
        expectedRainfall: 'high',
        expectedTempAvg: 28
      });

    expect(cotton.body.result.risk_level).toBe('High');
    expect(paddy.body.result.risk_level).toBe('Low');
    expect(cotton.body.result.risk_score).toBeGreaterThan(paddy.body.result.risk_score);
  });
});