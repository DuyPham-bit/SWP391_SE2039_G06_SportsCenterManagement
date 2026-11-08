import { loadSessionsBetween } from '../../class/@x/report.js';
import { asArray, centerId } from '../../../shared/api/apiUtils.js';
import { apiRequest } from '../../../shared/api/http.js';

export const reportApi = {
  async getOverview(period = '30D') {
    const today = new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10);
    const year = Number(today.slice(0, 4));
    const month = Number(today.slice(5, 7));
    let from = `${today.slice(0, 7)}-01`;
    let to = today;
    let groupBy = 'day';
    if (period === '30D' || period === 'LAST_30_DAYS') {
      const d = new Date(`${today}T00:00:00Z`);
      d.setUTCDate(d.getUTCDate() - 29);
      from = d.toISOString().slice(0, 10);
      to = today;
      groupBy = 'day';
    } else if (period === 'DAY') {
      from = today;
      to = today;
      groupBy = 'day';
    } else if (period === 'WEEK') {
      const current = new Date(`${today}T00:00:00Z`);
      const mondayOffset = (current.getUTCDay() + 6) % 7;
      current.setUTCDate(current.getUTCDate() - mondayOffset);
      from = current.toISOString().slice(0, 10);
      to = today;
      groupBy = 'day';
    } else if (period === 'LAST_MONTH' || period === 'PREV_MONTH') {
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;
      const lastDayOfPrevMonth = new Date(Date.UTC(prevYear, prevMonth, 0)).getUTCDate();
      from = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`;
      to = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(lastDayOfPrevMonth).padStart(2, '0')}`;
      groupBy = 'day';
    } else if (period === 'MONTH' || period === 'THIS_MONTH') {
      from = `${today.slice(0, 7)}-01`;
      to = today;
      groupBy = 'day';
    } else if (period === 'QUARTER') {
      const firstQuarterMonth = Math.floor((month - 1) / 3) * 3 + 1;
      from = `${year}-${String(firstQuarterMonth).padStart(2, '0')}-01`;
      to = today;
      groupBy = 'day';
    } else if (period === 'YEAR') {
      from = `${year}-01-01`;
      to = today;
      groupBy = 'month';
    } else if (typeof period === 'object' && period !== null) {
      from = period.from || from;
      to = period.to || to;
      groupBy = period.groupBy || 'day';
    }
    const startDate = new Date(`${from}T00:00:00Z`), endDate = new Date(`${to}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(from || '') || !/^\d{4}-\d{2}-\d{2}$/.test(to || '')
        || !Number.isFinite(startDate.getTime()) || !Number.isFinite(endDate.getTime())
        || startDate.toISOString().slice(0, 10) !== from || endDate.toISOString().slice(0, 10) !== to
        || from > to || (endDate - startDate) / 86400000 > 365 || !['day', 'month'].includes(groupBy)) {
      throw new Error('Chọn khoảng ngày hợp lệ, tối đa 366 ngày, nhóm theo ngày hoặc tháng.');
    }
    const query = new URLSearchParams({ from, to, groupBy, centerId: String(centerId()) });
    const checkinQuery = new URLSearchParams({ from: today, to: today, centerId: String(centerId()) });
    const [revenue, sportRevenue, membership, classes, rawSessionItems, operations, checkins, rawRooms, rawClasses] = await Promise.all([
      apiRequest(`reports/revenue?${query}`),
      apiRequest(`reports/revenue-by-sport?${new URLSearchParams({ from, to, centerId: String(centerId()) })}`),
      apiRequest(`reports/membership?${query}`),
      apiRequest(`reports/classes?${query}`),
      loadSessionsBetween(from, to),
      apiRequest(`reports/operations?${new URLSearchParams({ from, to, centerId: String(centerId()) })}`),
      apiRequest(`reports/checkins?${checkinQuery}`),
      apiRequest(`centers/${centerId()}/rooms`),
      apiRequest(`centers/${centerId()}/classes/all`)
    ]);
    const sessionItems = rawSessionItems.filter(item => String(item.sessionStatus).toUpperCase() !== 'CANCELLED');
    const capacity = sessionItems.reduce((sum, item) => sum + (item.capacity || 0), 0);
    const booked = sessionItems.reduce((sum, item) => sum + (item.bookedCount || 0), 0);
    const activeBookingCount = Object.entries(classes.currentStatusCounts || {})
      .filter(([status]) => /book|confirm|wait/i.test(status))
      .reduce((sum, [, count]) => sum + Number(count || 0), 0);

    const roomsList = asArray(rawRooms);
    const classesList = asArray(rawClasses);
    const roomMap = new Map(roomsList.map(r => [r.id, r]));
    const classDefMap = new Map(classesList.map(c => [c.id, c]));

    // 1. Seed classes stats
    const classStatsMap = new Map();
    for (const c of classesList) {
      classStatsMap.set(c.id, {
        id: c.id,
        name: c.name,
        sportName: c.sportName,
        coachName: c.coachName || 'Chưa gán HLV',
        roomName: c.roomName || roomMap.get(c.roomId)?.name || 'Chưa gán sân',
        sessionsCount: 0,
        booked: 0,
        capacity: 0,
        occupancyRate: 0
      });
    }

    // 2. Seed room stats
    const roomStatsMap = new Map();
    for (const r of roomsList) {
      roomStatsMap.set(r.id, {
        id: r.id,
        name: r.name,
        type: r.roomType || r.type || 'Sân/Phòng',
        location: r.locationDescription || r.location || '',
        unitCapacity: r.capacity || 0,
        sessionsCount: 0,
        booked: 0,
        capacity: 0,
        occupancyRate: 0,
        classes: new Set()
      });
    }

    // 3. Seed sport stats
    const sportStatsMap = new Map();

    for (const s of sessionItems) {
      // Class
      let cStat = classStatsMap.get(s.classId);
      if (!cStat) {
        cStat = {
          id: s.classId,
          name: s.className,
          sportName: s.sportName,
          coachName: s.coachName || 'Chưa gán HLV',
          roomName: (roomMap.get(s.roomId)?.name) || 'Chưa gán sân',
          sessionsCount: 0,
          booked: 0,
          capacity: 0,
          occupancyRate: 0
        };
        classStatsMap.set(s.classId, cStat);
      }
      cStat.sessionsCount += 1;
      cStat.booked += (s.bookedCount || 0);
      cStat.capacity += (s.capacity || 0);

      // Room
      const targetRoomId = s.roomId || classDefMap.get(s.classId)?.roomId;
      if (targetRoomId) {
        let rStat = roomStatsMap.get(targetRoomId);
        if (!rStat) {
          rStat = {
            id: targetRoomId,
            name: `Phòng ${targetRoomId}`,
            type: 'Sân/Phòng',
            location: '',
            unitCapacity: s.capacity || 0,
            sessionsCount: 0,
            booked: 0,
            capacity: 0,
            occupancyRate: 0,
            classes: new Set()
          };
          roomStatsMap.set(targetRoomId, rStat);
        }
        rStat.sessionsCount += 1;
        rStat.booked += (s.bookedCount || 0);
        rStat.capacity += (s.capacity || 0);
        if (s.className) rStat.classes.add(s.className);
      }

      // Sport
      const sportName = s.sportName || 'Khác';
      let spStat = sportStatsMap.get(sportName);
      if (!spStat) {
        spStat = {
          name: sportName,
          booked: 0,
          capacity: 0,
          sessionsCount: 0,
          classes: new Set()
        };
        sportStatsMap.set(sportName, spStat);
      }
      spStat.booked += (s.bookedCount || 0);
      spStat.capacity += (s.capacity || 0);
      spStat.sessionsCount += 1;
      if (s.className) spStat.classes.add(s.className);
    }

    const totalBookedAll = [...sportStatsMap.values()].reduce((sum, sp) => sum + sp.booked, 0);

    const topClasses = [...classStatsMap.values()]
      .map(c => ({
        ...c,
        occupancyRate: c.capacity > 0 ? Math.round((c.booked / c.capacity) * 100) : 0
      }))
      .sort((a, b) => b.booked - a.booked || b.occupancyRate - a.occupancyRate || b.sessionsCount - a.sessionsCount);

    const topRooms = [...roomStatsMap.values()]
      .map(r => ({
        ...r,
        classesCount: r.classes.size,
        classesList: [...r.classes],
        occupancyRate: r.capacity > 0 ? Math.round((r.booked / r.capacity) * 100) : 0
      }))
      .sort((a, b) => b.booked - a.booked || b.sessionsCount - a.sessionsCount || b.occupancyRate - a.occupancyRate);

    const topSports = [...sportStatsMap.values()]
      .map(sp => ({
        name: sp.name,
        booked: sp.booked,
        capacity: sp.capacity,
        sessionsCount: sp.sessionsCount,
        classesCount: sp.classes.size,
        percentage: sp.capacity > 0 ? Math.round((sp.booked / sp.capacity) * 100) : 0,
        share: totalBookedAll > 0 ? Math.round((sp.booked / totalBookedAll) * 100) : 0
      }))
      .sort((a, b) => b.booked - a.booked || b.percentage - a.percentage);

    // The operation report is calculated in the BLL from the scoped SQL data.
    // Keep the UI's rankings and personnel figures on the same source of truth as the API.
    const reportClasses = operations.classes || topClasses;
    const reportRooms = operations.rooms || topRooms;
    const reportSports = (operations.sports || []).map(item => ({
      ...item,
      percentage: item.occupancyRate,
      share: item.bookingShare
    }));

    return {
      from, to, groupBy,
      totalMembers: membership.totalMembers,
      activeMembers: membership.activeMembers,
      membersWithPackage: membership.membersWithPackage ?? membership.activeMembers ?? 0,
      membersWithoutPackage: membership.membersWithoutPackage ?? Math.max(0, Number(membership.totalMembers || 0) - Number(membership.activeMembers || 0)),
      expiredMembers: membership.expiredMembers || 0,
      newMembers: membership.newMembers,
      membershipPeriods: membership.periods || [],
      classStatusCounts: classes.currentStatusCounts || {},
      classPeriods: classes.periods || [],
      totalStaff: operations.totalStaff || 0,
      activeStaff: operations.activeStaff || 0,
      managerCount: operations.managerCount || 0,
      coachCount: operations.coachCount || 0,
      receptionistCount: operations.receptionistCount || 0,
      totalRooms: operations.totalRooms || 0,
      activeRooms: operations.activeRooms || 0,
      totalClasses: operations.sessionsCount ?? sessionItems.length,
      totalBookings: activeBookingCount,
      todayCheckins: checkins.count,
      occupancyRate: Number(operations.occupancyRate ?? (capacity ? Math.round((booked / capacity) * 100) : 0)),
      netRevenue: revenue.net,
      monthlyRevenue: revenue.net,
      grossRevenue: revenue.gross,
      refundedRevenue: revenue.refunds,
      revenueGrowth: null,
      revenuePeriods: revenue.periods || [],
      revenueBySport: sportRevenue.sports || [],
      allocatedSportRevenue: sportRevenue.allocatedNet || 0,
      unallocatedSportRevenue: sportRevenue.unallocatedNet || 0,
      utilizationBySport: reportSports.map(item => ({
        name: item.name,
        capacity: item.capacity,
        booked: item.booked,
        percentage: item.percentage
      })),
      topSports: reportSports,
      topClasses: reportClasses,
      topRooms: reportRooms,
      coaches: operations.coaches || [],
      coachesWithSessions: (operations.coaches || []).filter(coach => Number(coach.sessionsCount || 0) > 0).length,
      coachesWithoutSessions: (operations.coaches || []).filter(coach => Number(coach.sessionsCount || 0) === 0).length,
      highlights: {
        mostPopularClass: reportClasses[0] || null,
        mostPopularSport: reportSports[0] || null,
        highestRevenueSport: (sportRevenue.sports || []).find(item => item.sportId != null) || null,
        mostBookedRoom: reportRooms[0] || null
      }
    };
  }
};
