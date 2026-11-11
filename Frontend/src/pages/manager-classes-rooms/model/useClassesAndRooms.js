import { useState, useEffect, useMemo } from 'react';
import { useToast } from '../../../shared/ui/toast/ToastContext.jsx';
import { useLanguage } from '../../../shared/i18n/LanguageContext.jsx';
import { classApi } from '../../../entities/class/index.js';
import { roomApi } from '../../../entities/facility/index.js';
import { splitAndSortClasses, filterRoomsForSport, filterCoachesForSport, isRoomMatchingSport, isCoachMatchingSport, validateClassFields, validateRoomFields, validateSportFields, scheduleEndTime, validateScheduleForm, toCenterHours, DEFAULT_CENTER_HOURS, WEEK_DAYS, filterClasses } from './classManagementView.js';
import { todayDate, futureDate } from '../lib/scheduleTime.js';

export function useClassesAndRooms() {
  const { showSuccess, showError, showWarning } = useToast();
  const { language } = useLanguage();
  const isEn = language === 'en';

  const [tab, setTab] = useState('classes'); // 'classes' | 'cancelled' | 'rooms' | 'sports'
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
  const [data, setData] = useState({ classes: [], rooms: [], sports: [], coaches: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSportFilter, setSelectedSportFilter] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('');

  // Modals
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [schedules, setSchedules] = useState([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState(null);

  const loadData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const [classes, rooms, sports, coaches, center] = await Promise.all([
        classApi.getManagementClasses(),
        roomApi.getAll(),
        classApi.getManagementSports(),
        classApi.getCoaches(),
        // Hours only refine the form; the backend still enforces them if this lookup fails.
        classApi.getCenterHours().catch(() => null)
      ]);
      setData({
        classes: classes || [],
        rooms: rooms || [],
        sports: sports || [],
        coaches: coaches || [],
        centerHours: center ? toCenterHours(center) : DEFAULT_CENTER_HOURS
      });
      if (isManualRefresh) {
        showSuccess(isEn ? 'Data refreshed successfully!' : 'Đã cập nhật dữ liệu mới nhất!');
      }
    } catch (err) {
      setError(err.message || (isEn ? 'Cannot load classes and facilities data.' : 'Không thể tải dữ liệu lớp và cơ sở vật chất.'));
      showError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const classGroups = useMemo(() => splitAndSortClasses(data.classes), [data.classes]);

  // Filtered rooms and coaches for class modal based on selected sport
  const selectedClassSport = useMemo(() => {
    if (!form.sportId) return null;
    return data.sports.find((s) => String(s.id) === String(form.sportId)) || null;
  }, [data.sports, form.sportId]);

  const availableClassRooms = useMemo(() => {
    return filterRoomsForSport(data.rooms, selectedClassSport, form.roomId);
  }, [data.rooms, selectedClassSport, form.roomId]);

  const availableClassCoaches = useMemo(() => {
    if (!form.sportId) return [];
    return filterCoachesForSport(data.coaches, selectedClassSport, form.coachId);
  }, [data.coaches, selectedClassSport, form.coachId, form.sportId]);

  // Form Change Handler
  const handleFormChange = (e) => {
    setFormError('');
    const { name, value, type, checked } = e.target;
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
    setForm((prev) => {
      const next = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      };
      if (modal?.type === 'class' && name === 'sportId') {
        const selectedSport = data.sports.find((s) => String(s.id) === String(value));
        const currentRoom = data.rooms.find((r) => String(r.id) === String(prev.roomId));
        if (currentRoom && !isRoomMatchingSport(currentRoom, selectedSport)) {
          next.roomId = '';
        }
        const currentCoach = data.coaches.find((c) => String(c.id) === String(prev.coachId));
        if (currentCoach && !isCoachMatchingSport(currentCoach, selectedSport)) {
          next.coachId = '';
        }
      }
      return next;
    });
  };

  // Field Blur Handler for Inline Validation
  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (modal?.type === 'class') {
      const errs = validateClassFields({ ...form, [name]: value }, isEn);
      if (errs[name]) {
        setFieldErrors((prev) => ({ ...prev, [name]: errs[name] }));
      } else {
        setFieldErrors((prev) => {
          const next = { ...prev };
          delete next[name];
          return next;
        });
      }
    } else if (modal?.type === 'room') {
      const errs = validateRoomFields({ ...form, [name]: value }, isEn);
      if (errs[name]) {
        setFieldErrors((prev) => ({ ...prev, [name]: errs[name] }));
      } else {
        setFieldErrors((prev) => {
          const next = { ...prev };
          delete next[name];
          return next;
        });
      }
    } else if (modal?.type === 'sport') {
      const errs = validateSportFields({ ...form, [name]: value }, isEn);
      if (errs[name]) {
        setFieldErrors((prev) => ({ ...prev, [name]: errs[name] }));
      } else {
        setFieldErrors((prev) => {
          const next = { ...prev };
          delete next[name];
          return next;
        });
      }
    }
  };

  // Safe Action Wrapper
  const executeAction = async (fn, successMsg = isEn ? 'Operation successful!' : 'Thao tác thành công!') => {
    setBusy(true);
    try {
      await fn();
      showSuccess(successMsg);
      await loadData();
    } catch (err) {
      setFormError(err.message || (isEn ? 'An error occurred during execution.' : 'Có lỗi xảy ra trong quá trình thực hiện.'));
      showError(err.message || (isEn ? 'An error occurred during execution.' : 'Có lỗi xảy ra trong quá trình thực hiện.'));
    } finally {
      setBusy(false);
    }
  };

  // Open Modal Handlers
  const openClassModal = (row = null) => {
    setFormError('');
    setFieldErrors({});
    if (row) {
      setForm({
        name: row.name || '',
        sportId: row.sportId || '',
        roomId: row.roomId || '',
        coachId: row.coachId || '',
        capacity: row.capacity || 20,
        durationMinutes: row.durationMinutes || 60,
        level: row.level || 'Cơ bản',
        description: row.description || '',
        allowWaitlist: row.allowWaitlist !== false
      });
    } else {
      const firstActiveSport = data.sports.find((s) => s.status === 'Active');
      setForm({
        name: '',
        sportId: firstActiveSport ? firstActiveSport.id : '',
        roomId: '',
        coachId: '',
        capacity: 20,
        durationMinutes: 60,
        level: 'Cơ bản',
        description: '',
        allowWaitlist: true
      });
    }
    setModal({ type: 'class', row });
  };

  const openRoomModal = (row = null) => {
    setFormError('');
    setFieldErrors({});
    if (row) {
      setForm({
        name: row.name || '',
        type: row.type || '',
        capacity: row.capacity || 30,
        location: row.location || ''
      });
    } else {
      setForm({
        name: '',
        type: isEn ? 'Multi-purpose Court' : 'Phòng đa năng',
        capacity: 30,
        location: isEn ? 'Floor 1 - Sports Complex' : 'Tầng 1 - Khu liên hợp'
      });
    }
    setModal({ type: 'room', row });
  };

  const openSportModal = (row = null) => {
    setFormError('');
    setFieldErrors({});
    if (row) {
      setForm({
        name: row.name || '',
        description: row.description || '',
        status: row.status || 'Active'
      });
    } else {
      setForm({
        name: '',
        description: '',
        status: 'Active'
      });
    }
    setModal({ type: 'sport', row });
  };

  const openScheduleModal = async (classRow) => {
    try {
      setLoadingSchedules(true);
      setFormError('');
      setFieldErrors({});
      setSchedules([]);
      setEditingScheduleId(null);
      setModal({ type: 'schedule', row: classRow });
      const fetchedSchedules = await classApi.getSchedules(classRow.id);
      setSchedules(fetchedSchedules || []);
      const dur = Number(classRow.durationMinutes || 60);
      const defaultStart = '08:00';
      const defaultEnd = scheduleEndTime(defaultStart, dur);
      setForm({
        // Empty means "use the class default room". Persisting the same room id
        // as an override prevents later class-room changes from reaching sessions.
        roomId: '',
        dayOfWeek: 1,
        selectedDays: [1, 3, 5],
        startTime: defaultStart,
        endTime: defaultEnd,
        startDate: todayDate(),
        endDate: futureDate(90)
      });
    } catch (err) {
      showError(err.message || (isEn ? 'Cannot load schedules for this class.' : 'Không thể tải lịch học của lớp này.'));
    } finally {
      setLoadingSchedules(false);
    }
  };

  // Submit Modal Form
  const handleSaveModal = async (e) => {
    e.preventDefault();
    let errors = {};
    if (modal?.type === 'class') {
      errors = validateClassFields(form, isEn);
    } else if (modal?.type === 'room') {
      errors = validateRoomFields(form, isEn);
    } else if (modal?.type === 'sport') {
      errors = validateSportFields(form, isEn);
    } else if (modal?.type === 'schedule') {
      const scheduleErr = validateScheduleForm(form, modal.row?.durationMinutes, data.centerHours);
      if (scheduleErr) {
        setFormError(scheduleErr);
        return;
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstField = Object.keys(errors)[0];
      setFormError(errors[firstField]);
      const firstEl = document.querySelector(`[name="${firstField}"]`);
      if (firstEl) firstEl.focus();
      return;
    }

    setFormError('');
    setFieldErrors({});
    await executeAction(
      async () => {
        if (modal.type === 'class') {
          const body = {
            sportId: Number(form.sportId),
            roomId: form.roomId ? Number(form.roomId) : null,
            name: form.name.trim(),
            description: form.description ? form.description.trim() : null,
            level: form.level ? form.level.trim() : null,
            capacity: Number(form.capacity),
            durationMinutes: Number(form.durationMinutes || 60),
            allowWaitlist: form.allowWaitlist !== false
          };

          let savedClassId = modal.row ? modal.row.id : null;
          if (modal.row) {
            await classApi.update(modal.row.id, body);
          } else {
            const res = await classApi.create(body);
            savedClassId = res?.id || res?.classId;
          }

          if (savedClassId && form.coachId && String(form.coachId) !== String(modal.row?.coachId)) {
            try {
              await classApi.assignCoach(savedClassId, form.coachId);
            } catch (err) {
              const savedClass = { id: savedClassId, ...body };
              setModal({ type: 'class', row: savedClass });
              setFormError(
                isEn
                  ? `Saved class but could not assign coach: ${err.message || 'Please retry.'}`
                  : `Đã lưu thông tin lớp nhưng chưa phân công được HLV: ${err.message || 'Vui lòng thử lại.'}`
              );
              await loadData();
              throw new Error(
                isEn
                  ? `Saved class but could not assign coach: ${err.message || 'Please retry.'}`
                  : `Đã lưu lớp nhưng chưa phân công được HLV: ${err.message || 'Vui lòng thử lại.'}`
              );
            }
          }
        } else if (modal.type === 'sport') {
          const body = {
            name: form.name.trim(),
            description: form.description ? form.description.trim() : null,
            status: form.status || 'Active'
          };
          if (modal.row) {
            await classApi.updateSport(modal.row.id, body);
          } else {
            await classApi.createSport(body);
          }
        } else if (modal.type === 'room') {
          const body = {
            name: form.name.trim(),
            type: form.type ? form.type.trim() : null,
            capacity: Number(form.capacity),
            location: form.location ? form.location.trim() : null
          };
          if (modal.row) {
            await roomApi.update(modal.row.id, body);
          } else {
            await roomApi.create(body);
          }
        } else if (modal.type === 'schedule') {
          if (editingScheduleId) {
            const body = {
              roomId: form.roomId ? Number(form.roomId) : null,
              dayOfWeek: Number(form.dayOfWeek),
              startTime: form.startTime.length === 5 ? `${form.startTime}:00` : form.startTime,
              endTime: form.endTime.length === 5 ? `${form.endTime}:00` : form.endTime,
              startDate: form.startDate,
              endDate: form.endDate
            };
            await classApi.updateSchedule(modal.row.id, editingScheduleId, body);
            showSuccess(isEn ? 'Schedule updated successfully!' : 'Cập nhật ca học thành công!');
          } else {
            const daysToCreate = (form.selectedDays && form.selectedDays.length > 0)
              ? form.selectedDays
              : [Number(form.dayOfWeek ?? 1)];

            const errors = [];
            let successCount = 0;
            for (const day of daysToCreate) {
              const body = {
                roomId: form.roomId ? Number(form.roomId) : null,
                dayOfWeek: Number(day),
                startTime: form.startTime.length === 5 ? `${form.startTime}:00` : form.startTime,
                endTime: form.endTime.length === 5 ? `${form.endTime}:00` : form.endTime,
                startDate: form.startDate,
                endDate: form.endDate
              };
              try {
                await classApi.createSchedule(modal.row.id, body);
                successCount++;
              } catch (err) {
                errors.push(`${WEEK_DAYS[day]}: ${err.message || (isEn ? 'Conflict or error' : 'Trùng lịch hoặc lỗi')}`);
              }
            }

            if (errors.length > 0) {
              if (successCount === 0) {
                throw new Error(errors.join(' | '));
              } else {
                showWarning(
                  isEn
                    ? `Created ${successCount} session(s). Issues: ${errors.join('; ')}`
                    : `Đã tạo ${successCount} ca học. Ca bị lỗi: ${errors.join('; ')}`
                );
              }
            } else {
              const dayNames = daysToCreate.map((d) => WEEK_DAYS[d]).join(', ');
              showSuccess(
                isEn
                  ? `Successfully created schedules for: ${dayNames}!`
                  : `Đã tự động tạo thành công ${daysToCreate.length} ca học (${dayNames})!`
              );
            }
          }
          const refreshed = await classApi.getSchedules(modal.row.id);
          setSchedules(refreshed || []);
          setEditingScheduleId(null);
          const dur = Number(modal.row?.durationMinutes || 60);
          setForm((prev) => ({
            ...prev,
            dayOfWeek: 1,
            selectedDays: [1, 3, 5],
            startTime: '08:00',
            endTime: scheduleEndTime('08:00', dur)
          }));
          return;
        }
        setModal(null);
      },
      modal.type === 'schedule'
        ? (editingScheduleId
            ? (isEn ? 'Schedule updated successfully!' : 'Đã cập nhật ca học thành công!')
            : (isEn ? 'Class schedules created successfully!' : 'Đã tự động tạo lịch học thành công!'))
        : isEn
        ? 'Changes saved successfully!'
        : 'Đã lưu thay đổi thành công!'
    );
  };

  // Publish Class
  const handlePublishClass = async (cls) => {
    await executeAction(async () => {
      await classApi.publish(cls.id);
    }, isEn ? `Published class "${cls.name}" successfully!` : `Đã công bố lớp "${cls.name}" thành công!`);
  };

  // Cancel Class
  const handleConfirmCancelClass = async () => {
    if (!modal?.row) return;
    await executeAction(async () => {
      await classApi.cancel(modal.row.id);
      setModal(null);
    }, isEn ? `Cancelled class "${modal.row.name}".` : `Đã hủy lớp học "${modal.row.name}".`);
  };

  // Metrics Calculations
  const metrics = useMemo(() => {
    const classes = data.classes || [];
    const rooms = data.rooms || [];
    const sports = data.sports || [];

    const publishedClasses = classes.filter((c) => c.status === 'Published').length;
    const draftClasses = classes.filter((c) => c.status === 'Draft').length;
    const totalEnrolled = classes.reduce((sum, c) => sum + (c.enrolledCount || 0), 0);
    const totalRoomCapacity = rooms.reduce((sum, r) => sum + (r.capacity || 0), 0);
    const sharedSportsCount = sports.filter((s) => s.isShared).length;
    const customSportsCount = sports.length - sharedSportsCount;
    const publishedRatio = classes.length > 0 ? Math.round((publishedClasses / classes.length) * 100) : 0;

    return {
      totalClasses: classes.length,
      publishedClasses,
      draftClasses,
      totalEnrolled,
      totalRooms: rooms.length,
      totalRoomCapacity,
      totalSports: sports.length,
      sharedSportsCount,
      customSportsCount,
      publishedRatio
    };
  }, [data]);

  // Filtered Items for Active Tab
  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (tab === 'classes' || tab === 'cancelled') {
      const rows = tab === 'cancelled' ? classGroups.cancelled : classGroups.active;
      return filterClasses(rows, searchQuery).filter((cls) => {
        const matchesSport = !selectedSportFilter || String(cls.sportId) === String(selectedSportFilter);
        const matchesStatus =
          !selectedStatusFilter || String(cls.status).toLowerCase() === selectedStatusFilter.toLowerCase();
        return matchesSport && matchesStatus;
      });
    }

    if (tab === 'rooms') {
      return data.rooms.filter((room) => {
        const matchesQuery =
          !query ||
          (room.name && room.name.toLowerCase().includes(query)) ||
          (room.type && room.type.toLowerCase().includes(query)) ||
          (room.location && room.location.toLowerCase().includes(query));

        const matchesStatus =
          !selectedStatusFilter || String(room.status).toLowerCase() === selectedStatusFilter.toLowerCase();

        return matchesQuery && matchesStatus;
      });
    }

    if (tab === 'sports') {
      return data.sports.filter((sport) => {
        const matchesQuery =
          !query ||
          (sport.name && sport.name.toLowerCase().includes(query)) ||
          (sport.description && sport.description.toLowerCase().includes(query));

        const matchesStatus =
          !selectedStatusFilter || String(sport.status).toLowerCase() === selectedStatusFilter.toLowerCase();

        return matchesQuery && matchesStatus;
      });
    }

    return [];
  }, [data, classGroups, tab, searchQuery, selectedSportFilter, selectedStatusFilter]);

  return {
    availableClassCoaches, error, loading, availableClassRooms, busy, classGroups, data, editingScheduleId,
    executeAction, fieldErrors, filteredItems, form, formError, handleBlur, handleConfirmCancelClass,
    handleFormChange, handlePublishClass, handleSaveModal, isEn, loadData, loadingSchedules, metrics,
    modal, openClassModal, openRoomModal, openScheduleModal, openSportModal, refreshing, schedules,
    searchQuery, selectedSportFilter, selectedStatusFilter, setEditingScheduleId, setForm, setModal,
    setSchedules, setSearchQuery, setSelectedSportFilter, setSelectedStatusFilter, setTab,
    setViewMode, tab, viewMode
  };
}
