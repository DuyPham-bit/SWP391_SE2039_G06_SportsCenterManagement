import {
  INITIAL_SPORTS,
  INITIAL_USERS,
  INITIAL_ROOMS,
  INITIAL_PACKAGES,
  INITIAL_CLASSES,
  INITIAL_BOOKINGS,
  INITIAL_CHECKINS,
  INITIAL_TRAINING_PLANS,
  INITIAL_PROGRESS_RECORDS,
  INITIAL_ATTENDANCES,
  INITIAL_COACH_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_PERMISSIONS
} from './mockData.js';

const STORAGE_PREFIX = 'SCMS_DB_';

export const DB_KEYS = {
  SPORTS: 'sports',
  USERS: 'users',
  ROOMS: 'rooms',
  PACKAGES: 'packages',
  CLASSES: 'classes',
  BOOKINGS: 'bookings',
  CHECKINS: 'checkins',
  TRAINING_PLANS: 'training_plans',
  PROGRESS: 'progress',
  ATTENDANCES: 'attendances',
  NOTIFICATIONS: 'notifications',
  AUDIT_LOGS: 'audit_logs',
  PERMISSIONS: 'permissions'
};

const DB_VERSION_KEY = 'DATA_VERSION';
const CURRENT_DATA_VERSION = 'v3_5_classes_plans_members';

class DBStorage {
  constructor() {
    this.initDatabase();
  }

  initDatabase(forceReset = false) {
    const isFirstRun = !localStorage.getItem(STORAGE_PREFIX + DB_KEYS.USERS);
    const storedVersion = localStorage.getItem(STORAGE_PREFIX + DB_VERSION_KEY);

    if (forceReset || isFirstRun) {
      this.set(DB_KEYS.SPORTS, INITIAL_SPORTS);
      this.set(DB_KEYS.USERS, INITIAL_USERS);
      this.set(DB_KEYS.ROOMS, INITIAL_ROOMS);
      this.set(DB_KEYS.PACKAGES, INITIAL_PACKAGES);
      this.set(DB_KEYS.CLASSES, INITIAL_CLASSES);
      this.set(DB_KEYS.BOOKINGS, INITIAL_BOOKINGS);
      this.set(DB_KEYS.CHECKINS, INITIAL_CHECKINS);
      this.set(DB_KEYS.TRAINING_PLANS, INITIAL_TRAINING_PLANS);
      this.set(DB_KEYS.PROGRESS, INITIAL_PROGRESS_RECORDS);
      this.set(DB_KEYS.ATTENDANCES, INITIAL_ATTENDANCES);
      this.set(DB_KEYS.NOTIFICATIONS, INITIAL_COACH_NOTIFICATIONS);
      this.set(DB_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
      this.set(DB_KEYS.PERMISSIONS, INITIAL_PERMISSIONS);
      localStorage.setItem(STORAGE_PREFIX + DB_VERSION_KEY, CURRENT_DATA_VERSION);
    } else if (storedVersion !== CURRENT_DATA_VERSION) {
      // Clear transactions and classes while retaining master data
      this.set(DB_KEYS.CLASSES, INITIAL_CLASSES);
      this.set(DB_KEYS.BOOKINGS, INITIAL_BOOKINGS);
      this.set(DB_KEYS.CHECKINS, INITIAL_CHECKINS);
      this.set(DB_KEYS.TRAINING_PLANS, INITIAL_TRAINING_PLANS);
      this.set(DB_KEYS.PROGRESS, INITIAL_PROGRESS_RECORDS);
      this.set(DB_KEYS.ATTENDANCES, INITIAL_ATTENDANCES);
      this.set(DB_KEYS.NOTIFICATIONS, INITIAL_COACH_NOTIFICATIONS);
      this.set(DB_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
      localStorage.setItem(STORAGE_PREFIX + DB_VERSION_KEY, CURRENT_DATA_VERSION);
    }
  }

  get(key) {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + key);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed) && parsed.length === 0) {
        if (key === DB_KEYS.CLASSES && INITIAL_CLASSES.length > 0) {
          this.set(DB_KEYS.CLASSES, INITIAL_CLASSES);
          return INITIAL_CLASSES;
        }
        if (key === DB_KEYS.BOOKINGS && INITIAL_BOOKINGS.length > 0) {
          this.set(DB_KEYS.BOOKINGS, INITIAL_BOOKINGS);
          return INITIAL_BOOKINGS;
        }
      }
      return parsed;
    } catch (e) {
      console.error(`Error reading ${key} from storage:`, e);
      return [];
    }
  }

  set(key, data) {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error(`Error writing ${key} to storage:`, e);
      return false;
    }
  }

  insert(key, item) {
    const list = this.get(key);
    const newItem = {
      ...item,
      id: item.id || `${key.substring(0, 3)}-${Date.now()}`
    };
    list.unshift(newItem);
    this.set(key, list);
    return newItem;
  }

  update(key, id, partial) {
    const list = this.get(key);
    const index = list.findIndex(item => item.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...partial };
      this.set(key, list);
      return list[index];
    }
    return null;
  }

  remove(key, id) {
    const list = this.get(key);
    const filtered = list.filter(item => item.id !== id);
    this.set(key, filtered);
    return true;
  }

  logAudit(userName, role, action, details) {
    const log = {
      id: `log-${Date.now()}`,
      userName: userName || 'Hệ thống',
      role: role || 'SYSTEM',
      action,
      details,
      timestamp: new Date().toLocaleString('vi-VN'),
      status: 'SUCCESS'
    };
    const logs = this.get(DB_KEYS.AUDIT_LOGS);
    logs.unshift(log);
    this.set(DB_KEYS.AUDIT_LOGS, logs);
    return log;
  }

  resetAll() {
    this.initDatabase(true);
  }
}

export const db = new DBStorage();
