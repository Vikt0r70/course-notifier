import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import NotificationService from '../services/notification/NotificationService';

export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    // Support ?includeRead=true to get all notifications (including read ones)
    const includeRead = req.query.includeRead === 'true';
    const notifications = await NotificationService.getAllNotifications(req.user!.id, includeRead);
    res.json({ success: true, data: notifications });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const success = await NotificationService.markAsRead(Number(id), req.user!.id);

    if (!success) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAllAsRead = async (req: AuthRequest, res: Response) => {
  try {
    await NotificationService.markAllAsRead(req.user!.id);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
