import { Bookings } from '@/types';

const GUEST_BOOKINGS_COOKIE = 'guest_bookings';
const COOKIE_EXPIRY_DAYS = 30;

export const guestCookieUtils = {
  /**
   * Save a guest booking to cookies
   */
  setGuestBooking: (booking: Bookings) => {
    try {
      const existingBookings = guestCookieUtils.getGuestBookings();
      
      // Check if booking already exists (by ID)
      const updatedBookings = existingBookings.filter(b => b.id !== booking.id);
      updatedBookings.push(booking);
      
      // Set cookie with expiry
      const expiryDate = new Date();
      expiryDate.setTime(expiryDate.getTime() + (COOKIE_EXPIRY_DAYS * 24 * 60 * 60 * 1000));
      
      document.cookie = `${GUEST_BOOKINGS_COOKIE}=${JSON.stringify(updatedBookings)}; expires=${expiryDate.toUTCString()}; path=/; sameSite=strict`;
    } catch (error) {
      console.error('Error saving guest booking to cookies:', error);
    }
  },

  /**
   * Get all guest bookings from cookies
   */
  getGuestBookings: (): Bookings[] => {
    try {
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === GUEST_BOOKINGS_COOKIE) {
          const bookings = JSON.parse(decodeURIComponent(value));
          return Array.isArray(bookings) ? bookings : [];
        }
      }
      return [];
    } catch (error) {
      console.error('Error reading guest bookings from cookies:', error);
      return [];
    }
  },

  /**
   * Remove a specific guest booking from cookies
   */
  removeGuestBooking: (bookingId: string) => {
    try {
      const existingBookings = guestCookieUtils.getGuestBookings();
      const filteredBookings = existingBookings.filter(b => b.id !== bookingId);
      
      if (filteredBookings.length === 0) {
        // No bookings left, remove the cookie entirely
        document.cookie = `${GUEST_BOOKINGS_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; sameSite=strict`;
      } else {
        // Update cookie with remaining bookings
        const expiryDate = new Date();
        expiryDate.setTime(expiryDate.getTime() + (COOKIE_EXPIRY_DAYS * 24 * 60 * 60 * 1000));
        
        document.cookie = `${GUEST_BOOKINGS_COOKIE}=${JSON.stringify(filteredBookings)}; expires=${expiryDate.toUTCString()}; path=/; sameSite=strict`;
      }
    } catch (error) {
      console.error('Error removing guest booking from cookies:', error);
    }
  },

  /**
   * Clear all guest bookings from cookies
   */
  clearAllGuestBookings: () => {
    try {
      document.cookie = `${GUEST_BOOKINGS_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; sameSite=strict`;
    } catch (error) {
      console.error('Error clearing guest bookings from cookies:', error);
    }
  },

  /**
   * Check if there are any guest bookings in cookies
   */
  hasGuestBookings: (): boolean => {
    return guestCookieUtils.getGuestBookings().length > 0;
  }
};
