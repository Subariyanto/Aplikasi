import { Profile, UserRole } from '../types';

export const FULL_LICENSE_PRICE = 'Rp. 50.000,-';
export const CONTACT_PERSON_NAME = 'SUBARIYANTO, S.Pd, M.Pd.I.';
export const CONTACT_PERSON_ROLE = 'Ketua Pokjawas Madrasah Kab. Jember / Pemilik Otoritas';
export const CONTACT_PERSON_PHONE = '082330647698';

/**
 * Checks whether a given user is in Trial mode.
 */
export function isTrialUser(user: Profile | null | undefined): boolean {
  if (!user) return false;
  return user.role === UserRole.TRIAL || user.is_trial === true || user.status_user === 'Trial';
}

/**
 * Calculates trial remaining time in days, hours, and formatted string.
 */
export function getTrialRemainingTime(user: Profile | null | undefined) {
  if (!user || !isTrialUser(user)) {
    return { days: 0, hours: 0, minutes: 0, isExpired: false, formatted: 'FULL LISENSI' };
  }

  // Determine expiration date (default to 3 days from created_at or tanggal_aktivasi if missing)
  let expiresAtMs = 0;
  if (user.trial_expires_at) {
    expiresAtMs = new Date(user.trial_expires_at).getTime();
  } else if (user.tanggal_aktivasi) {
    expiresAtMs = new Date(user.tanggal_aktivasi).getTime() + 3 * 24 * 60 * 60 * 1000;
  } else if (user.created_at) {
    expiresAtMs = new Date(user.created_at).getTime() + 3 * 24 * 60 * 60 * 1000;
  } else {
    expiresAtMs = Date.now() + 3 * 24 * 60 * 60 * 1000;
  }

  const diffMs = expiresAtMs - Date.now();

  if (diffMs <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      isExpired: true,
      formatted: 'Masa Trial Habis (0 Hari)'
    };
  }

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  let formatted = '';
  if (days > 0) {
    formatted = `${days} Hari ${hours} Jam`;
  } else if (hours > 0) {
    formatted = `${hours} Jam ${minutes} Mnt`;
  } else {
    formatted = `${minutes} Menit`;
  }

  return {
    days,
    hours,
    minutes,
    isExpired: false,
    formatted
  };
}
