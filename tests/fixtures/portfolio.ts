import { emptyPlanner } from '../../lib/storage/planner';
import { createStay, createTrip } from '../../lib/trips/trips';
import type { PortfolioRequest } from '../../lib/portfolio/optimizer';
export const PORTFOLIO_AS_OF = '2026-10-13';
// Synthetic prices only; never inserted into the production catalog.
export function portfolioFixture(propertyId = 'property-fixture') {
  const data = emptyPlanner(); data.profile.balance = 100_000; data.profile.valuationCpp = 1;
  data.workspace.trips = [[1000, 100000], [600, 30000], [400, 80000]].map(([cash, points], index) => {
    const trip = createTrip(`journey-${index}`); trip.name = ['Luxury', 'Park', 'City'][index]!;
    const stay = createStay(`stop-${index}`, propertyId);
    stay.checkIn = `2027-0${index + 1}-10`; stay.observedAt = PORTFOLIO_AS_OF;
    stay.pricing = { ...stay.pricing, cashRoom: cash!, cashTaxes: 0, cashFees: 0, awardCash: 0, awardPoints: points!, comparable: 'same' };
    trip.stays = [stay]; return trip;
  });
  data.workspace.activeId = data.workspace.trips[0]!.id;
  return data;
}
export function portfolioRequest(): PortfolioRequest {
  return { selectedTripIds: ['journey-0', 'journey-1', 'journey-2'], priorities: [], certificateEligibleStayIds: [], cashBudgetUsd: null, asOf: PORTFOLIO_AS_OF };
}
