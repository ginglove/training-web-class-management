export const ERROR_MESSAGES: Record<string, string> = {
  ERR_TIME_TOO_SOON: 'Thời gian bắt đầu phải cách hiện tại ít nhất 2 giờ',
  ERR_ATTENDEES_EXCEEDED: 'Số lượng người tham gia vượt quá sức chứa của phòng',
  ERR_CANNOT_CLOSE_CLASS: 'Không thể đóng phòng: Phòng đang có lịch đặt đã được duyệt',
  ERR_CANNOT_DELETE_LAST_ADMIN: 'Không thể xóa tài khoản Admin cuối cùng của hệ thống',
  ERR_CANNOT_DEMOTE_LAST_ADMIN: 'Không thể thay đổi quyền của tài khoản Admin cuối cùng',
  ERR_CLASS_CONFLICT_ON_APPROVE: 'Phòng đã được đặt trong khoảng thời gian này',
  ERR_CLASS_NOT_AVAILABLE: 'Phòng hiện không có sẵn để đặt',
  ERR_QUOTA_EXCEEDED: 'Bạn đã vượt quá giới hạn số lượng đặt phòng trong tuần',
  ERR_SELF_DEACTIVATE: 'Không thể tự vô hiệu hóa tài khoản của chính mình',
  ERR_ROOM_NAME_EXISTS: 'Tên phòng này đã tồn tại trong hệ thống',
  
  // Logic Errors from SRS v4 (Chương 15, 16, 17)
  ERR_SYSTEM_OVERLOADED: 'Hệ thống tạm thời quá tải', // LOGIC-SYS-002
  ERR_OUTSIDE_OPERATING_HOURS: 'Thời gian đặt nằm ngoài giờ hoạt động của phòng', // LOGIC-BK-EXT-003
  ERR_AVATAR_TOO_LARGE: 'Ảnh quá lớn. Vui lòng chọn ảnh dưới 2MB', // LOGIC-PRF-EXT-001
  ERR_CONCURRENT_PROFILE_UPDATE: 'Dữ liệu đã được cập nhật từ phiên khác. Vui lòng tải lại trang.', // LOGIC-PRF-EXT-003
  ERR_CONFLICT_BOOKING: 'Phòng vừa được đặt bởi người khác. Vui lòng chọn thời gian khác.', // LOGIC-BK-EXT-001
};

export function getErrorMessage(err: unknown, fallbackMessage: string = 'Đã có lỗi xảy ra'): string {
  const errorObj = err as Record<string, unknown> | null;
  
  // 1. Try to match exact error codes
  if (typeof errorObj?.error === 'string' && ERROR_MESSAGES[errorObj.error]) {
    // Some error messages contain dynamic data (like number of bookings). 
    // We can use the default translation, or append the original message for context if needed.
    // But for ERR_TIME_TOO_SOON we strictly return the requested translation.
    if (errorObj.error === 'ERR_CANNOT_CLOSE_CLASS' && typeof errorObj.message === 'string') {
       // Extracting the dynamic part if possible, or just using the safe translated one.
       return `${ERROR_MESSAGES[errorObj.error]} (${errorObj.message})`;
    }
    return ERROR_MESSAGES[errorObj.error];
  }
  
  // 2. Try to translate common english messages
  if (typeof errorObj?.message === 'string') {
    const msg = errorObj.message.toLowerCase();
    if (msg.includes('invalid credentials')) return 'Email hoặc mật khẩu không chính xác';
    if (msg.includes('already registered')) return 'Email hoặc tên đăng nhập đã được sử dụng';
    if (msg.includes('account locked') || msg.includes('too many failed attempts')) return 'Tài khoản đã bị khóa do đăng nhập sai nhiều lần';
    if (msg.includes('inactive')) return 'Tài khoản chưa được kích hoạt';
    if (msg.includes('not found')) return 'Không tìm thấy dữ liệu';
    if (msg.includes('invalid or expired refresh token')) return 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại';
    if (msg.includes('payload too large') || msg.includes('file too large')) return ERROR_MESSAGES.ERR_AVATAR_TOO_LARGE;
    if (msg.includes('service unavailable')) return ERROR_MESSAGES.ERR_SYSTEM_OVERLOADED;
    if (msg.includes('conflict')) return ERROR_MESSAGES.ERR_CONFLICT_BOOKING;

    // Return original message if no translation found
    return errorObj.message as string;
  }
  
  return fallbackMessage;
}
