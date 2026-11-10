import { useState, useMemo, useEffect } from 'react';
import { useToast } from '../../../shared/ui/toast/ToastContext.jsx';
import { useLanguage } from '../../../shared/i18n/LanguageContext.jsx';
import { filterCompatibleCoaches, filterAndSortAssignmentClasses, coachWorkload, isCoachCompatible } from './coachAssignmentView.js';
import { classApi } from '../../../entities/class/index.js';

export function useCoachAssignment() {
  const { showSuccess, showError } = useToast();
  const { language } = useLanguage();
  const isEn = language === 'en';

  const [classes, setClasses] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSportFilter, setSelectedSportFilter] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL'); // 'ALL' | 'ASSIGNED' | 'UNASSIGNED' | 'MISMATCH'
  const [publicationTab, setPublicationTab] = useState('PUBLISHED'); // 'PUBLISHED' | 'PENDING'
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'

  // Assignment Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedCoachId, setSelectedCoachId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState(null);

  // Compatible coaches filtered specifically for the selected class discipline
  const compatibleCoaches = useMemo(() => {
    return filterCompatibleCoaches(coaches, selectedClass);
  }, [coaches, selectedClass]);

  const loadData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const [classList, staffList] = await Promise.all([
        classApi.getManagementClasses(),
        classApi.getCoaches()
      ]);
      setClasses(filterAndSortAssignmentClasses(classList || []));
      setCoaches(coachWorkload(staffList || [], classList || []));
      if (isManualRefresh) {
        showSuccess(isEn ? 'Coach assignment data refreshed!' : 'Dữ liệu phân công HLV đã được làm mới!');
      }
    } catch (e) {
      setError(e.message || (isEn ? 'Error loading coach assignment data.' : 'Lỗi tải dữ liệu phân công HLV.'));
      showError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAssignModal = (cls) => {
    const compatible = filterCompatibleCoaches(coaches, cls);
    const currentIsCompatible = compatible.some((coach) => String(coach.id) === String(cls.coachId));
    setSelectedClass(cls);
    setSelectedCoachId(currentIsCompatible ? String(cls.coachId) : String(compatible[0]?.id || ''));
    setAssignError(null);
    setModalOpen(true);
  };

  const handleConfirmAssign = async (event) => {
    event.preventDefault();
    if (
      !selectedCoachId ||
      !isCoachCompatible(
        coaches.find((coach) => String(coach.id) === String(selectedCoachId)),
        selectedClass
      )
    ) {
      setAssignError({ message: isEn ? 'Please select a coach matching class discipline.' : 'Vui lòng chọn HLV có chuyên môn phù hợp với lớp.' });
      return;
    }
    if (String(selectedCoachId) === String(selectedClass.coachId)) {
      setAssignError({ message: isEn ? 'This coach is already assigned to this class. Select another coach to reassign.' : 'HLV này đang phụ trách lớp. Hãy chọn một HLV khác để thay đổi.' });
      return;
    }
    setAssigning(true);
    setAssignError(null);
    try {
      await classApi.assignCoach(selectedClass.id, selectedCoachId);
      const assignedCoach = coaches.find((c) => String(c.id) === String(selectedCoachId));
      showSuccess(
        isEn
          ? `Assigned coach [${assignedCoach?.fullName || 'Coach'}] to class "${selectedClass.name}" successfully!`
          : `Đã phân công HLV [${assignedCoach?.fullName || 'HLV'}] cho lớp "${selectedClass.name}" thành công!`
      );
      setModalOpen(false);
      await loadData();
    } catch (err) {
      setAssignError(err);
      showError(err.message || (isEn ? 'Error assigning coach' : 'Lỗi khi phân công HLV'));
    } finally {
      setAssigning(false);
    }
  };

  // KPI Metrics Calculation
  const metrics = useMemo(() => {
    const totalClasses = classes.length;
    const assignedClasses = classes.filter((c) => Boolean(c.coachId)).length;
    const unassignedClasses = totalClasses - assignedClasses;
    const coverageRatio = totalClasses > 0 ? Math.round((assignedClasses / totalClasses) * 100) : 0;

    let mismatchCount = 0;
    classes.forEach((cls) => {
      if (cls.coachId) {
        const coach = coaches.find((c) => String(c.id) === String(cls.coachId));
        if (coach?.specialization && cls.sportName) {
          const isMatch = isCoachCompatible(coach, cls);
          if (isMatch === false) mismatchCount++;
        }
      }
    });

    return {
      totalClasses,
      assignedClasses,
      unassignedClasses,
      totalCoaches: coaches.length,
      coverageRatio,
      mismatchCount
    };
  }, [classes, coaches]);

  // Unique Sports List for Filter Dropdown
  const uniqueSports = useMemo(() => {
    const set = new Set();
    classes.forEach((c) => {
      if (c.sportName) set.add(c.sportName);
    });
    return Array.from(set).sort();
  }, [classes]);

  // Filtered Classes List
  const filteredClasses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return classes.filter((cls) => {
      const isPublished = String(cls.status || '').toUpperCase() === 'PUBLISHED';
      const matchesPublication = publicationTab === 'PUBLISHED' ? isPublished : !isPublished;
      const matchesQuery =
        !query ||
        (cls.name && cls.name.toLowerCase().includes(query)) ||
        (cls.sportName && cls.sportName.toLowerCase().includes(query)) ||
        (cls.coachName && cls.coachName.toLowerCase().includes(query)) ||
        (cls.roomName && cls.roomName.toLowerCase().includes(query)) ||
        (cls.level && cls.level.toLowerCase().includes(query));

      const matchesSport = !selectedSportFilter || cls.sportName === selectedSportFilter;

      let matchesStatus = true;
      if (selectedStatusFilter === 'ASSIGNED') {
        matchesStatus = Boolean(cls.coachId);
      } else if (selectedStatusFilter === 'UNASSIGNED') {
        matchesStatus = !cls.coachId;
      } else if (selectedStatusFilter === 'MISMATCH') {
        if (!cls.coachId) return false;
        const coach = coaches.find((c) => String(c.id) === String(cls.coachId));
        const isMatch = coach ? isCoachCompatible(coach, cls) : true;
        matchesStatus = isMatch === false;
      }

      return matchesPublication && matchesQuery && matchesSport && matchesStatus;
    });
  }, [classes, coaches, searchQuery, selectedSportFilter, selectedStatusFilter, publicationTab]);

  return {
    assignError, assigning, classes, coaches, compatibleCoaches, error, filteredClasses,
    handleConfirmAssign, isEn, loadData, loading, metrics, modalOpen, openAssignModal,
    publicationTab, refreshing, searchQuery, selectedClass, selectedCoachId, selectedSportFilter,
    selectedStatusFilter, setAssignError, setModalOpen, setPublicationTab, setSearchQuery,
    setSelectedCoachId, setSelectedSportFilter, setSelectedStatusFilter, setViewMode, uniqueSports,
    viewMode
  };
}
