import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ProblemReport, User } from '../models';

// Create a new problem report
export const createReport = async (req: AuthRequest, res: Response) => {
  try {
    const { title, category, description } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Validate fields
    if (!title || !category || !description) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (!['bug', 'feature', 'other'].includes(category)) {
      return res.status(400).json({ success: false, message: 'Invalid category' });
    }

    if (title.length > 255) {
      return res.status(400).json({ success: false, message: 'Title must be 255 characters or less' });
    }

    if (description.length > 5000) {
      return res.status(400).json({ success: false, message: 'Description must be 5000 characters or less' });
    }

    const report = await ProblemReport.create({
      userId,
      title,
      category,
      description,
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully',
      data: report,
    });
  } catch (error: any) {
    console.error('Error creating report:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all reports (admin only)
export const getReports = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 50, status, category } = req.query;

    const whereClause: any = {};
    if (status) whereClause.status = status;
    if (category) whereClause.category = category;

    const offset = (Number(page) - 1) * Number(limit);

    const { rows: reports, count } = await ProblemReport.findAndCountAll({
      where: whereClause,
      limit: Number(limit),
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email'],
        },
      ],
    });

    res.json({
      success: true,
      data: {
        reports,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(count / Number(limit)),
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a report (admin only)
export const deleteReport = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const report = await ProblemReport.findByPk(id);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    await report.destroy();

    res.json({
      success: true,
      message: 'Report deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting report:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
