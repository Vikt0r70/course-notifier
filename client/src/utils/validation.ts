export const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePassword = (password: string): { isValid: boolean; message?: string } => {
  if (password.length < 8) {
    return { isValid: false, message: 'يجب أن تكون كلمة المرور 8 أحرف على الأقل' };
  }
  return { isValid: true };
};

export const validateUsername = (username: string): { isValid: boolean; message?: string } => {
  if (username.length < 3) {
    return { isValid: false, message: 'يجب أن يكون اسم المستخدم 3 أحرف على الأقل' };
  }
  if (username.length > 100) {
    return { isValid: false, message: 'اسم المستخدم طويل جداً' };
  }
  return { isValid: true };
};

export const validateAge = (age: number): { isValid: boolean; message?: string } => {
  if (age < 16) {
    return { isValid: false, message: 'يجب أن يكون العمر 16 سنة على الأقل' };
  }
  if (age > 100) {
    return { isValid: false, message: 'العمر غير صحيح' };
  }
  return { isValid: true };
};
